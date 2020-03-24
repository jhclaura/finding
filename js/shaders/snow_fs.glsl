precision highp float;

varying vec4 vColor;
varying vec3 vPosition;

void main() {
	vec4 col = vec4( vColor );
	gl_FragColor = col;
}