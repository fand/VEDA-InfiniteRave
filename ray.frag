/*{
  glslify: true,
  audio: true,
  pixelRatio: 1,
  frameskip: 1,
}*/
precision mediump float;
uniform vec2  resolution;
uniform float time;
uniform float volume;

vec2 doModel(vec3 p);
#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 200)
#pragma glslify: square = require('glsl-square-frame')
#pragma glslify: camera = require('glsl-camera-ray')
#pragma glslify: getNormal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: sdTorus = require('glsl-sdf-primitives/sdTorus')
#pragma glslify: sdBox = require('glsl-sdf-primitives/sdBox')
#pragma glslify: opU = require('glsl-sdf-ops/union')
#pragma glslify: smin = require('glsl-smooth-min')
#pragma glslify: noise4 = require('glsl-noise/simplex/4d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#define PI 3.141593

vec2 rot(vec2 st, float t){
  float c = cos(t), s = sin(t);
  return mat2(c, -s, s, c) * st;
}

vec2 doModel(vec3 p) {
  float blockSize = 3.;

  p = mod(p, blockSize) - (blockSize / 2.);
  p /= (blockSize / 2.);

  // p.yz /= 3.;

  // p += noise3(p) * sin(time) * .3;
  // p.xy = rot(p.xy, time * .2);


  vec2 m = vec2(99999);
  m = opU(m, vec2(sdBox(p, vec3(1., .1, .1)), 0));
  m = opU(m, vec2(sdBox(p, vec3(.1, .1, 1.)), 0));
  m = opU(m, vec2(sdBox(p, vec3(.1, 1., .1)), 0));

  return m;
}

vec3 doMaterial(vec3 pos, vec3 nor, float materialId) {
  if (materialId == 0.0) {
    return vec3(0, 1, 1);
  }
  else {
    return vec3(1, .2, .5)* .7;
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

void main() {
  float cameraAngle  = 0.2 * time;
  vec3 rayOrigin = vec3(3.5 * sin(cameraAngle), 3.0, 3.5 * cos(cameraAngle));
  vec3 rayTarget = vec3(0, 0, 0);
  vec2 screenPos = square(resolution);

  // float r = fract(sin(dot(vec2(time), vec2(9382.,498.))) * 392.);
  float v = floor(mod(volume * 5., 10.));


  // screenPos += sin(time * .2) *.3;
  // screenPos = rot(screenPos, length(screenPos) + time * .6);
  screenPos = screenPos / pow(length(screenPos), 2.); // fisheye

  vec3 rayDirection = camera(rayOrigin, rayTarget, screenPos, 1.0);

  vec3 col = vec3(0.015);
  vec2 t = raytrace(rayOrigin, rayDirection, 80., 0.01);

  if (t.x > -0.5) {
    vec3 pos = rayOrigin + t.x * rayDirection;
    vec3 nor = getNormal(pos);
    vec3 mal = doMaterial(pos, nor, t.y);

    col = doLighting(pos, nor, rayDirection, t.x, mal);
  }
  else {
    col = vec3(0);
  }

  // Color grading
  col = pow(clamp(col,0.0,1.0), vec3(0.45));

  col = fract(col * 3. + time +t.x);

  col = col * 2. - 1.;

  col = 1. - col * 20.;

  gl_FragColor = vec4( col, 1.0 );
}
