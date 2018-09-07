/*{
  glslify: true,
  pixelRatio:1,
  // server: 3000,
}*/
precision mediump float;

uniform vec2  resolution;
uniform float time;

vec2 doModel(vec3 p);

#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 30)
#pragma glslify: noise4    = require('glsl-noise/simplex/4d')
#pragma glslify: noise3    = require('glsl-noise/simplex/3d')
#pragma glslify: noise2    = require('glsl-noise/simplex/2d')
#pragma glslify: square   = require('glsl-square-frame')
#pragma glslify: smin     = require('glsl-smooth-min')
#pragma glslify: camera   = require('glsl-camera-ray')
#pragma glslify: sdTorus 	= require('glsl-sdf-primitives/sdTorus')

vec2 rot(vec2 st, float t){
  float c = cos(t), s = sin(t);
  return mat2(c, -s, s, c) * st;
}


vec2 doModel(vec3 p) {
  float blocks = 4.0 + sin(time) * 2.0;

  vec3 block = floor(p / blocks);
  float blockNoise = fract(sin(noise3(block) * 300.));

  p = mod(p, blocks) - (blocks / 2.0);

  if (blockNoise < .2) {
    p.xy = rot(p.xy, time + blockNoise * 20.);
    p.xz = rot(p.xz, time + blockNoise * 50.);
    return vec2(sdTorus(p, vec2(0.8, 0.1)), 1);
  }
  else if (blockNoise < .4) {
    float r = 1.0;
    r += noise4(vec4(p * 0.75, time)) * 0.5;
    return vec2(length(p) - r, 0);
  }
  else {
    return vec2(length(p) + 0., 0);
  }
}

vec3 doMaterial(vec3 pos, vec3 nor, float materialId) {
  if (materialId == 0.0) {
    return vec3(0, 1, 1);
  }
  else {
    return vec3(1, .4, .5);
  }
}

vec3 doLighting(vec3 pos, vec3 nor, vec3 rd, float dis, vec3 mal) {
  vec3 lin = vec3(0.0);

  vec3  lig = normalize(vec3(1.0,0.7,0.9));
  float dif = max(dot(nor,lig),0.0);

  lin += dif*vec3(2);
  lin += vec3(0.05);

  return mal*lin;
}

vec3 calcNormal(vec3 pos) {
  const float eps = 0.02;

  const vec3 v1 = vec3( 1.0,-1.0,-1.0);
  const vec3 v2 = vec3(-1.0,-1.0, 1.0);
  const vec3 v3 = vec3(-1.0, 1.0,-1.0);
  const vec3 v4 = vec3( 1.0, 1.0, 1.0);

  return normalize( v1*doModel( pos + v1*eps ).x +
                    v2*doModel( pos + v2*eps ).x +
                    v3*doModel( pos + v3*eps ).x +
                    v4*doModel( pos + v4*eps ).x );
}

void main() {
  float cameraAngle  = 0.8 * time;
  vec3  rayOrigin    = vec3(3.5 * sin(cameraAngle), 3.0, 3.5 * cos(cameraAngle));
  vec3  rayTarget    = vec3(0, 0, 0);
  vec2  screenPos    = square(resolution);
  vec3  rayDirection = camera(rayOrigin, rayTarget, screenPos, 2.0);

  vec3 col = vec3(0.015);
  vec2 t   = raytrace(rayOrigin, rayDirection);

  if (t.x > -0.5) {
    vec3 pos = rayOrigin + t.x * rayDirection;
    vec3 nor = calcNormal(pos);
    vec3 mal = doMaterial(pos, nor, t.y);

    col = doLighting(pos, nor, rayDirection, t.x, mal);
  }
  else {
    col = vec3(0);
  }

  // col = pow(clamp(col,0.0,1.0), vec3(0.4545));

  gl_FragColor = vec4( col, 1.0 );
}
