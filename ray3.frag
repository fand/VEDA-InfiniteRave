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
#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 100)
#pragma glslify: square = require('glsl-square-frame')
#pragma glslify: camera = require('glsl-camera-ray')
#pragma glslify: getNormal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: sdTorus = require('glsl-sdf-primitives/sdTorus')
#pragma glslify: sdBox = require('glsl-sdf-primitives/sdBox')
#pragma glslify: sdCylinder = require('glsl-sdf-primitives/sdCylinder')
#pragma glslify: opU = require('glsl-sdf-ops/union')
#pragma glslify: opS = require('glsl-sdf-ops/subtraction')
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
  vec2 m = vec2(99999);
  vec3 p1 = p;
  m = opU(m, vec2(sdBox(p1, vec3(1,1,1)), 0.));

  float blockSize = 3.;// + sin(time);
  p.xy = rot(p.xy, p.z * .2 + time * .2);
  p.xz = rot(p.xz, p.y * .2 + time);

  p = mod(p, blockSize) - (blockSize / 2.);
  p /= (blockSize / 2.);


  // m = opU(m, vec2(sdBox(p, vec3(.1, 10., .1)), 0));
  // m = opU(m, vec2(sin(p.x * 0.02 + time) + cos(p.y * 0.002 + time), 1));

  float s = .4 + sin(time) * length(p) * .2;
  s = .43;
  // p *= 1. + sin(time) * .2;
  float k = 1. - (
    s / length(p) +
    s / length(p + vec3(1, 1, 1)) +
    s / length(p + vec3(1, 1, -1)) +
    s / length(p + vec3(1, -1, 1)) +
    s / length(p + vec3(1, -1, -1)) +
    s / length(p + vec3(-1, 1, 1)) +
    s / length(p + vec3(-1, 1, -1)) +
    s / length(p + vec3(-1, -1, 1)) +
    s / length(p + vec3(-1, -1, -1))
  ) * .3;

  m = opU(m, vec2(k, 1));

  // holes
  p = mod(p, .4) - .2;
  p *= 1. + sin(time) * .2;
  p.xy = rot(p.xy, time);

  float h = .15;
  // m.x = opS(sdBox(p, vec3(h, 1., h)), m.x);

  return m;
}

vec3 doMaterial(vec3 pos, vec3 nor, float materialId) {
  if (materialId == 0.0) {
    // return vec3(0, .3, 1);
    return vec3(.2, .0, 0);
  }
  // else if (materialId == 1.0) {
  //   return vec3(1, .4, .2)* .5;
  // }
  else {
    return vec3(1, .2, .0);
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
  float cameraAngle  = 0.5 * time;
  vec3 rayOrigin = vec3(3.5 * sin(cameraAngle), 3.0, 3.5 * cos(cameraAngle));
  vec3 rayTarget = vec3(0, 0, 0);
  vec2 screenPos = square(resolution);

  // float r = fract(sin(dot(vec2(time), vec2(9382.,498.))) * 392.);
  float v = floor(mod(volume * 5., 10.));

  // screenPos *= screenPos;
  // screenPos = rot(screenPos, floor(length(screenPos) * 10. - time * 3.) + time * .6);
  // screenPos = rot(screenPos, floor((abs(screenPos.x) + abs(screenPos.y)) * 3.) + time * .6);
  // screenPos = screenPos / pow(length(screenPos), 2.); // fisheye

  vec3 rayDirection = camera(rayOrigin, rayTarget, screenPos, .4);

  // rayDirection.xy = rot(rayDirection.xy, time * .1);
  // rayDirection.xz = rot(rayDirection.xz, time * .2);

  vec3 col = vec3(0.015);
  vec2 t = raytrace(rayOrigin, rayDirection, 13., 0.003, .6);

  if (t.x > -0.5) {
    vec3 pos = rayOrigin + t.x * rayDirection;
    vec3 nor = getNormal(pos);
    vec3 mal = doMaterial(pos, nor, t.y);

    col = doLighting(pos, nor, rayDirection, t.x, mal);
    col *= t.x;
  }
  else {
    col = vec3(0, .5, .3) * .8;
  }

  // Color grading
  col = pow(clamp(col,0.0,1.0), vec3(0.4));

  // col = fract(col * 3. + time + t.x);
  // col = col * 2. - 1.;
  // col = step(.5, col);

  // col = 1. - col * 2.;

  gl_FragColor = vec4( col, 1.0 );
}