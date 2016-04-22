var context=new AudioContext();  //global audio context
if(!context) context=new webkitAudioContext(); //old shit

function isBrowserSupported(){
	return context&&context.createOscillator()&&context.createGain();
}

function Point(xmlNode){
	if(xmlNode.tagName!="Point") throw "Was expecting a Point, got "+xmlNode.tagName;
	try{
		this.t=Number(xmlNode.getAttribute("time"));
		if(this.t<0) throw "Time must be >=0";
		this.val=Number(xmlNode.getAttribute("value"));
	}catch(e){
		throw "Invalid XML: "+e;
	}
}

Point.prototype={
	constructor:Point,
	getT:function(){return this.t;},
	getVal:function(){return this.val;}
}

function Envelope(xmlNode){
	if(xmlNode.tagName!="Envelope") throw "Was expecting an Envelope, got "+xmlNode.tagName;
	try{
		this.p=[];
		this.len=Number(xmlNode.getAttribute("length"));
		if(this.len<0) throw "Invalid length";
		this.name=xmlNode.getAttribute("name");
		for(var i=0;i<xmlNode.childNodes.length;i++){
			var x=xmlNode.childNodes[i];
			if(x.tagName=="Point"){
				var pt=new Point(x);
				if(pt.getT()>this.len) throw "Point Time must be <= Envelope Length";
				this.p.push(pt);
			}
		}
		if(this.p.length==0) throw "Envelope cannot be empty";
		this.cache_lastX=-1;
		for(var i=0;i<this.p.length-1;i++){
			for(var j=i+1;j<this.p.length;j++){
				if(this.p[i].getT()>this.p[j].getT()){
					var temp=this.p[i];
					this.p[i]=this.p[j];
					this.p[j]=temp;
				}
			}
		}
		if(this.p[0].getT()!=0) throw "First Point in Envelope must have TIme = 0";
	}catch(e){
		throw "Invalid XML: "+e;
	}
}

Envelope.prototype={
	constructor:Envelope,
	getLength:function(){
		return this.len;
	},
	get:function(t){
		if(this.p.length==1 || t<=0) return this.p[0].val;
		if(t>=this.p[this.p.length-1].getT()) return this.p[this.p.length-1].getVal();
		var x=-1;
		var cacheCopy=this.cache_lastX;
		if(cacheCopy!=-1 && this.p[cacheCopy].getT()<=t&&this.p[cacheCopy+1].getT()>=t) x=cacheCopy; else{
			for(var i=0;i<this.p.length-1;i++){
				if(this.p[i].getT()<=t&&this.p[i+1].getT()>=t){x=i; break;}
			}
			this.cache_lastX=x;
		}
		if(t==this.p[x].getT()||this.p[x].getVal()==this.p[x+1].getVal()||this.p[x].getT()==this.p[x+1].getT()) return this.p[x].getVal();
		var f=(t-this.p[x].getT())/(this.p[x+1].getT()-this.p[x].getT());
		return this.p[x+1].getVal()*f+this.p[x].getVal()*(1-f);
	},
	getPointCount:function(){
		return this.p.length;
	},
	getVal:function(i){
		return this.p[i].getVal();
	},
	getT:function(i){
		return this.p[i].getT();
	}
}

function EntrainmentTrack(xmlNode){
	if(xmlNode.tagName!="EntrainmentTrack") throw "Was expecting EntrainmentTrack, got "+xmlNode.tagName;
	try{
		this.len=Number(xmlNode.getAttribute("length"));
		if(this.len<0) throw "Invalid EntrainmentTrack Length";
		this.ent=null;
		this.vol=null;
		this.baseFreq=null;
		this.trackVolume=Number(xmlNode.getAttribute("trackVolume"));
		if(this.trackVolume<0||this.trackVolume>1) throw "Invalid Track Volume";
		for(var i=0;i<xmlNode.childNodes.length;i++){
			var x=xmlNode.childNodes[i];
			if(x.tagName=="Envelope"){
				if(x.getAttribute("name")=="entrainmentFrequency") this.ent=new Envelope(x);
				if(x.getAttribute("name")=="volume") this.vol=new Envelope(x);
				if(x.getAttribute("name")=="baseFrequency") this.baseFreq=new Envelope(x);
			}
		}
		if(!this.ent) throw "Missing EntrainmentTrack Envelope";
		if(!this.vol) throw "Missing Volume Envelope";
		if(!this.baseFreq) throw "Missing Base Frequency Envelope";
		if(this.ent.getLength()!=this.len||this.vol.getLength()!=this.len||this.baseFreq.getLength()!=this.len) throw "Envelopes lengths must be the same as the EntrainmentTrack they belong to";
	}catch(e){
		throw "Invalid XML: "+e;
	}
}

EntrainmentTrack.prototype={
	constructor:EntrainmentTrack,
	getLength:function(){
		return this.len;
	},
	getEntrainmentFrequency:function(t){
		return this.ent.get(t);
	},
	getVolume:function(t){
		return this.vol.get(t);
	},
	getBaseFrequency:function(t){
		return this.baseFreq.get(t);
	},
	getTrackVolume:function(){
		return this.trackVolume;
	}
}

function PresetInfos(xmlNode){
	if(xmlNode.tagName!="PresetInfos") throw "Was expecting PresetInfos, got "+xmlNode.tagName;
	try{this.title=xmlNode.getElementsByTagName("Title")[0].firstChild.nodeValue;}catch(e){this.title="";}
	try{this.author=xmlNode.getElementsByTagName("Author")[0].firstChild.nodeValue;}catch(e){this.author="";}
	try{this.desc=xmlNode.getElementsByTagName("Description")[0].firstChild.nodeValue;}catch(e){this.desc="";}
}

PresetInfos.prototype={
	constructor:PresetInfos,
	getTitle:function(){return this.title;},
	getAuthor:function(){return this.author;},
	getDescription:function(){return this.desc;}
}

function Preset(xmlNode){
	if(xmlNode.tagName!="Preset") throw "Was expecting Preset, got "+xmlNode.tagName;
	try{
		this.len=Number(xmlNode.getAttribute("length"));
		this.info=null;
		this.noise=null;
		this.loop=xmlNode.getAttribute("loop");
		if(!this.loop) this.loop=-1; else this.loop=Number(this.loop);
		if(this.loop<0) this.loop=-1;
		this.ent=[];
		for(var i=0;i<xmlNode.childNodes.length;i++){
			var x=xmlNode.childNodes[i];
			if(x.tagName.indexOf("PresetInfos")==0) this.info=new PresetInfos(x);
			if(x.tagName.indexOf("Envelope")==0 && x.getAttribute("name").indexOf("noise")==0) this.noise=new Envelope(x);
			if(x.tagName.indexOf("EntrainmentTrack")==0) this.ent.push(new EntrainmentTrack(x));
		}
		if(!this.info) throw "Missing PresetInfos";
		if(!this.noise) throw "Missing Noise Envelope";
		if(this.ent.length==0) throw "There must be at least 1 EntrainmentTrack";
		for(var i=0;i<this.ent.length;i++){if(this.ent[i].getLength()!=this.len) throw "EntrainmentTracks must have the same length as the Preset they belong to";}
	}catch(e){
		throw "Invalid XML: "+e;
	}
}

Preset.prototype={
	constructor:Preset,
	getEntrainmentTrackCount:function(){
		return this.ent.length;
	},
	getLength:function(){
		return this.len;
	},
	getLoop:function(){
		return this.loop;
	},
	loops:function(){
		return this.loop!=-1;
	},
	getEntrainmentTrack:function(i){
		return this.ent[i];
	},
	getNoiseEnvelope:function(){
		return this.noise;
	},
	getInfo:function(){
		return this.info;
	}
}

//SmoothPulseGenerator
var SQRT_2PI=Math.sqrt(2*Math.PI);
function gauss(x,mu,sigma){
	return ((1.0 / (sigma * SQRT_2PI)) * Math.exp(-(Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2)))));
}
var PULSE_SMOOTH=0.7, PULSE_WIDTH=0.15, PULSE_FLOOR=-0.8,PULSE_CEIL=1.0, PULSE_NSAMPLES=8192;
var PULSE=[];
var max=-1;
for (var i = 0; i < PULSE_NSAMPLES; i++) {
	var x = i /  PULSE_NSAMPLES;
	PULSE[i] = gauss(Math.pow(x, PULSE_SMOOTH), 0.5, PULSE_WIDTH);
	if (PULSE[i] > max) {
		max = PULSE[i];
	}
}
for (var i = 0; i < PULSE_NSAMPLES; i++) {
	PULSE[i] = PULSE_FLOOR + (PULSE_CEIL - PULSE_FLOOR) * (PULSE[i] / max);
}
function SmoothPulseOscillator(){
	
}

function EntrainmentTrackRenderer(et,destination){
	this.et=et;
	this.track=context.createGain();
	this.track.gain.value=this.et.getTrackVolume(); //ent track volume from preset
	this.track.connect(destination);
	this.volumeEnv=context.createGain();
	this.volumeEnv.gain.value=0; //controlled by setT(t) method
	this.volumeEnv.connect(this.track);
	this.baseMULent=context.createGain();
	this.baseMULent.connect(this.volumeEnv);
	this.baseFOsc=context.createOscillator();
	this.baseFOsc.frequency.value=0; //controlled by setT(t) method
	this.baseFOsc.connect(this.baseMULent);
	this.baseFOsc.start(0);
	this.entFOsc=context.createScriptProcessor(16384,1,1);
	this.entFOsc.t=0;
	this.entFOsc.frequency=0; //controlled by setT(t) method
	this.entFOsc.onaudioprocess=function(e){
		var output = e.outputBuffer.getChannelData(0);
		var tStep=1.0/context.sampleRate;
		for(var i=0;i<16384;i++){
			output[i]=PULSE[~~((this.t%1)*PULSE_NSAMPLES)];
			this.t+=tStep*this.frequency;
		}
	}.bind(this.entFOsc);
	this.entFOsc.connect(this.baseMULent.gain);
	
}

EntrainmentTrackRenderer.prototype={
	constructor:EntrainmentTrackRenderer,
	setT:function(t){
		this.entFOsc.frequency=this.et.getEntrainmentFrequency(t);
		this.volumeEnv.gain.value=this.et.getVolume(t);
		this.baseFOsc.frequency.value=this.et.getBaseFrequency(t);
	}
}

function NoiseRenderer(env,destination){
	this.env=env;
	this.track=context.createGain();
	this.track.gain.value=0; //controlled by setT(t) method
	this.track.connect(destination);
	this.pinkNoise = (function() {
		var b0, b1, b2, b3, b4, b5, b6;
		b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
		var node = context.createScriptProcessor(2048, 1, 1);
		node.onaudioprocess = function(e) {
			var output = e.outputBuffer.getChannelData(0);
			for (var i = 0; i < 2048; i++) {
				var white = Math.random() * 2 - 1;
				b0 = 0.99886 * b0 + white * 0.0555179;
				b1 = 0.99332 * b1 + white * 0.0750759;
				b2 = 0.96900 * b2 + white * 0.1538520;
				b3 = 0.86650 * b3 + white * 0.3104856;
				b4 = 0.55000 * b4 + white * 0.5329522;
				b5 = -0.7616 * b5 - white * 0.0168980;
				output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
				output[i] *= 0.025;  //volume of noise must be <=0.025
				b6 = white * 0.115926;
			}
		}
		return node;
	})();
	this.pinkNoise.connect(this.track);
}

NoiseRenderer.prototype={
	constructor:NoiseRenderer,
	setT:function(t){
		this.track.gain.value=this.env.get(t);
	}
}

function IsochronicRenderer(p){
	this.t=0;
	this.p=p;
	this.master=context.createGain();
	this.master.connect(context.destination);
	this.ent=[];
	this.entMaster=context.createGain();
	this.entMaster.connect(this.master);
	this.noise=new NoiseRenderer(p.getNoiseEnvelope(),this.master);
	var totEntVol=0;
	for(var i=0;i<p.getEntrainmentTrackCount();i++){
		this.ent.push(new EntrainmentTrackRenderer(p.getEntrainmentTrack(i),this.entMaster));
		totEntVol+=p.getEntrainmentTrack(i).getTrackVolume();
	}
	if(totEntVol<1) totEntVol=1;
	this.entMaster.gain.value=0.25/totEntVol;
	this.playing=false;
	this.volume=0.5;
	var isochronicRendererThis=this;
	this.timer=setInterval(function(){
		if(!isochronicRendererThis.playing){
			isochronicRendererThis.master.gain.value=0;
		}else{
			if(isochronicRendererThis.t>=isochronicRendererThis.p.getLength()){
				if(isochronicRendererThis.p.loops()) isochronicRendererThis.t=isochronicRendererThis.p.getLoop(); else{ isochronicRendererThis.playing=false; isochronicRendererThis.t=0;}
			}
			isochronicRendererThis.master.gain.value=isochronicRendererThis.volume;
			isochronicRendererThis.noise.setT(isochronicRendererThis.t);
			for(var i=0;i<isochronicRendererThis.ent.length;i++) isochronicRendererThis.ent[i].setT(isochronicRendererThis.t);
			isochronicRendererThis.t+=0.05;
		}
	},50);
}

IsochronicRenderer.prototype={
	constructor:IsochronicRenderer,
	play:function(){
		this.playing=true;
	},
	pause:function(){
		this.playing=false;
	},
	isPlaying:function(){
		return this.playing;
	},
	setT:function(t){
		this.t=t<0?0:t>this.p.getLength()?this.p.getLength():t;
	},
	getT:function(){
		return this.t;
	},
	setVolume:function(vol){
		this.volume=vol<0?0:vol>1?1:vol;
	},
	getVolume:function(){
		return this.volume;
	},
	terminate:function(){ //this shit needs to be improved. at the moment, there is no way to destroy all nodes in the web audio api, so even after terminating this renderer, it will still be hogging resources.
		clearInterval(this.timer);
		this.master.disconnect();
		context=null;
		playing=false;
	}
}


