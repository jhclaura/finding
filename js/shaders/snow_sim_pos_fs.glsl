//precision highp float;

uniform float delta;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution.xy;

	vec3 position = texture2D( texturePosition, uv ).xyz;
	vec3 velocity = texture2D( textureVelocity, uv ).xyz;

	if(position.y<-50.0){
		position.y = 0.0;
		velocity = vec3(0.0);
	}

	gl_FragColor = vec4( position + velocity * delta, 1.0 );
}