precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float sineTime;
uniform float deltaTime;
uniform float time;

attribute vec3 position;
attribute vec3 offset;
attribute vec4 color;
attribute float timeOffset;

varying vec3 vPosition;
varying vec4 vColor;
varying float tOffset;

vec3 acce = vec3(0.0, -9.8, 0.0);
vec3 velocity = vec3(0.0, 0.0, 0.0);
//vec3 force = vec3(0.0, 0.0, 0.0);


void main() {
	//vPosition = position + offset * max( abs( sinetime * 2.0 + 1.0 ), 0.5 );
	//vPosition = position + offset + velocity * (time-timeOffset) + acce * 0.5 * (time-timeOffset) * (time-timeOffset);

	vPosition = position + offset + acce * 0.5 * (time-tOffset) * (time-tOffset);

	vColor.x = (time-tOffset);
	vColor.y = (time-tOffset);
	vColor.z = (time-tOffset);

    // if hitting ground, reset
    if (vPosition.y < -50.0) {
       //vPosition.y = 0.0;
       //pos.x = -30.0 + random(pos.xz) * 60.0;
       //pos.z = -20.0 + random(pos.xz) * 50.0;
       //velocity *= 0.0;
       //timeOffset = time;

       tOffset = time;

       //vColor.x = (time-tOffset);
       //vColor.y = (time-tOffset);
       //vColor.z = (time-tOffset);
    }	

	gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
}