
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
//attribute vec3 offset;
attribute vec2 uv;
attribute vec4 color;

varying vec4 vColor;
varying vec3 vPosition;

void main() {
  vec3 pos = texture2D( texturePosition, uv ).xyz;
	vPosition = position + pos;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}