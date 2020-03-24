// reference: https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_birds.html

uniform float time;
uniform float delta;  // about 0.016
uniform float gravity;

const float width = resolution.x;
const float height = resolution.y;

float rand( vec2 co ){
  return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
}

void main() {
	vec2 uv = gl_FragCoord.xy / resolution.xy;

	vec3 position = texture2D( texturePosition, uv ).xyz;
	vec3 velocity = texture2D( textureVelocity, uv ).xyz;

	// interact with other snow...
	//vec3 snowPosition, snowVelocity;
	//for ( float y = 0.0; y < height; y++ ) {
	//	for ( float x = 0.0; x < width; x++ ) {
	//		// particle coords
	//		vec2 ref = vec2(x+0.5, y+0.5) / resolution.xy;
	//		position = texture2D( texturePosition, ref ).xyz;
	//		velocity = texture2D( textureVelocity, ref ).xyz;
	//	}
	//}

	velocity.y += gravity * delta;

	if(position.y<-50.0){
		velocity = vec3(0.0);
	}

	gl_FragColor = vec4( velocity, 1.0 );
}