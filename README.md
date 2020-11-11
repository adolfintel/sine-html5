# SINE Isochronic Entrainer
SINE Isochronic Entrainer is a Free and Open Source Brainwave Entrainment application.

Brainwave Entrainment is the practice of using sounds, visual stimuli or even electromagnetic fields to alter the frequency of brainwaves.
It can be done for several reasons: people with insomnia can take great benefit from it, but it can also be used to improve your attention span, and even simulate the effects of some recreational drugs.
The effect is not permanent, and fades away in less than a minute after the stimuli is removed.

Isochronic tones are a commonly used aural stimuli for Brainwave Entrainment, consisting of short pulses of a sine wave, varying in frequency. Unlike binaural beats, isochronic tones can be played on speakers. 

This is a partial port of LibBWEntrainment and SINE. It can play .sin presets using the Web Audio API.

This port can ONLY PLAY presets, and it works in a completely different way than the original Java version. Sound synthesis is provided almost entirely by the browser, so sound quality varies with the browser you're using, and it sounds slightly different from the PC/Android version.
That said, I tried to make it sounds as similar to the original as possible.
All other capabilities of LibBWEntrainment were sacrificced in this port. There is absolutely no modularity: all it does is load a .sin file via AJAX, and render it as Isochronic tones. As a result of these limitations, it is very small and relatively lightweight. No libraries or frameworks were used.
 
## Website
[SINE Isochronic Entrainer](https://sine.fdossena.com/)

## Files
* sine.js: contains the main implementation of LibBWEntrainment classes, and a isBrowserSupported() method that you can use to  check browser capabilities
* player.html and null.png: embeddable player (or you can use sine.js directly)
* example.html and test.sin: an example of how to use the player, and how to access its contents. This is only for demonstration, you can delete them.

## Compatibility
Firefox 25+, Google Chrome 35+, Opera 22+, Microsoft Edge 12+, Safari 9+.

Note: Some browsers will not let the player access the .sin file from the hard drive, so you must load your entire site to a server and and access it from there. Also, for security reasons, .sin files can only be loaded from the same domain.

## Screenshots
![Screenshot](https://fdossena.com/sine/webapp1.png)

## License
Copyright (C) 2015-2020 Federico Dossena

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/lgpl>.
