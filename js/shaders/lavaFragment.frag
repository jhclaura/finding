// source: https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/

varying vec2 vUv;
varying float noise;
uniform sampler2D tExplosion;
uniform vec3 color_1;
uniform vec3 color_2;
uniform vec3 color_3;

float random( vec3 scale, float seed ){
  return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;
}

void main() {

  // float r = .01 * random( vec3( 12.9898, 78.233, 151.7182 ), 0.0 );
  // vec2 tPos = vec2( 0, 1.3 * noise + r );
  // vec4 color = texture2D( tExplosion, tPos );
  //vec3 color = vec3(vUv * (1. - 2. * noise), 0.0);
  float _noise = 1. - 1. * noise;
  vec3 color = vec3(color_1.x * _noise, color_1.y * _noise, color_1.z * _noise);
  gl_FragColor = vec4( color.rgb, 1.0 );

}