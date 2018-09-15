/*{
  glslify: true,
  audio: true,
  midi: true,
  pixelRatio: 1.5,
  frameskip: 1,
  PASSES: [
    { fs: "mem.frag", TARGET: "mem", FLOAT: true },
    {},
  ],
}*/
precision mediump float;
uniform vec2  resolution;
uniform float time;
uniform float volume;
uniform sampler2D midi;
uniform sampler2D mem;
uniform sampler2D backbuffer;

vec2 doModel(vec3 p);
#pragma glslify: raytrace = require('./utils/raytrace', map = doModel, steps = 100)
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

float cc(in float c) {
  return texture2D(midi, vec2(176. / 256., c / 128.)).x * 2.;
}

float t() {
  return texture2D(mem, vec2(0)).y;
}

float DE2(vec3 z) {
  // z.xy = mix(z.xy, rot(z.xy, z.z + time * .3), cc(17.));
  // z.xz = mix(z.xz, rot(z.xz, z.y +time * .8), cc(17.));
  // z.xy = rot(z.xy, z.z + time * .3);
  // z.xz = rot(z.xy, z.y +time * .8);

  float r;
  int n = 0;
  float Scale = 2.0;
  float Offset = 2.0;

  vec3 n1 = normalize(vec3(1, 1, 0));
  vec3 n2 = normalize(vec3(1, 0, 1));
  vec3 n3 = normalize(vec3(0, 1, 1));

  for (int i = 0; i < 5; i++) {
    z -= 2. * min(0., dot(z, n1)) * n1;  // fold
    z -= 2. * min(0., dot(z, n2)) * n2;
    z -= 2. * min(0., dot(z, n3)) * n3;
    z = z*Scale - Offset*(Scale-1.0);
    z.xz = rot(z.xz, float(i) * .3 * time);
    z.xy = rot(z.xy, float(i) * .4 * time);
    // z.xy = rot(z.xy, time * .3);

    n++;
  }

  // return (length(z) ) * pow(Scale, -float(n));
  return (sdBox(z, vec3(2.3)) ) * pow(Scale, -float(n));
}

vec2 doModel(vec3 p) {
  vec2 m = vec2(99999);
  // m = opU(m, vec2(sdBox(p1, vec3(1,1,1)*(1. + volume * .01)), 0.));

  m.y = step(.3, noise3(p));

  p.xz = rot(p.xz, p.y * .1);

  float unit = 2.;

  p = mod(p, unit * 2.) -unit;
  // p /= unit;
  m.x = DE2(p);



  return m;
}

vec3 doMaterial(vec3 pos, vec3 nor, float materialId) {
  if (materialId == 0.0) {
    return vec3(1, .0, .8);
  }
  else {
    return vec3(0, 3., .5);
  }
}

vec3 doLighting(vec3 pos, vec3 nor, vec3 rd, float dis, vec3 mal) {
  vec3 lin = vec3(0.0);

  vec3  lig = normalize(vec3(1.0,0.7,0.9));
  float dif = max(dot(nor,lig),0.0);

  lin += dif*vec3(2);
  lin += vec3(0.3);

  return mal*lin;
}

vec3 bloom(in float level) {
  float d = level * .01;
  vec3 b = vec3(0.);

  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 uvr = uv;
  vec2 uvg = uv;
  vec2 uvb = uv;

  for (int i = 0; i < 30; i++) {
    uvg = (uvg - .5) * (1. - d) + .5;
    uvg = (uvg - .5) * (1. - d * 2.) + .5;
    uvr = (uvb - .5) * (1. - d * 3.) + .5;

    b += vec3(
      texture2D(backbuffer, uvr).r,
      texture2D(backbuffer, uvg).g,
      texture2D(backbuffer, uvb).b
    );
  }

  return b * level * .05;
}


void main() {
  float cameraAngle  = 0.1 * t();
  vec3 rayOrigin = vec3(3.5 * sin(cameraAngle), 3.0, 3.5 * cos(cameraAngle));
  vec3 rayTarget = vec3(0, 0, 0);
  vec2 screenPos = square(resolution);

  // float r = fract(sin(dot(vec2(time), vec2(9382.,498.))) * 392.);
  float v = floor(mod(volume * 5., 10.));

  // screenPos *= screenPos;
  // screenPos = rot(screenPos, floor(length(screenPos) * 10. - time * 3.) + time * .6);
  // screenPos = rot(screenPos, floor((abs(screenPos.x) + abs(screenPos.y)) * 3.) + time * .6);
  // screenPos = screenPos / pow(length(screenPos), 2.); // fisheye
  // screenPos = screenPos / pow(length(screenPos), -2.); // fisheye

  vec3 rayDirection = camera(rayOrigin, rayTarget, screenPos, 1.4);

  rayDirection.xy = rot(rayDirection.xy, time * .1);
  rayDirection.xz = rot(rayDirection.xz, time * .2);

  vec3 col = vec3(0.015);
  vec3 t = raytrace(rayOrigin, rayDirection, 10., 0.003, .6);

  if (t.x > -0.5) {
    vec3 pos = rayOrigin + t.x * rayDirection;
    vec3 nor = getNormal(pos);
    vec3 mal = doMaterial(pos, nor, t.y);

    col = doLighting(pos, nor, rayDirection, t.x, mal);
    // col.b += 10. / t.z;
    // col *= 1. / abs(t.x);
    // col = fract(col + t.x* .3);

    col.b += t.z *.1;
    col.g -= sin(t.x);
  }
  else {
    col = vec3(0, .5, .3) * .0;
  }

  // Color grading
  col = pow(clamp(col,0.0,1.0), vec3(0.4));

  col *= (1. - 10. / t.z);

  // col = fract(col * 3. + time + t.x);
  // col = col * 2. - 1.;
  // col = step(.5, col);

  // col = 1. - col * 2.;

  // col *= cc(0.);
  col *= 0.3;

  // col += bloom(cc(22.));
  // col += bloom(.2);
  col += texture2D(backbuffer, gl_FragCoord.xy / resolution).rgb * .3;

  gl_FragColor = vec4( col, 1.0 );
}
