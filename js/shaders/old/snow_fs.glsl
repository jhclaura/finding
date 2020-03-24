precision highp float;

uniform float time;

varying vec4 vColor;
varying vec3 vPosition;

void main() {
	vec4 col = vec4( vColor );
	//col.r += sin( vPosition.x * 10.0 + time) * 0.5;
	gl_FragColor = col;
}