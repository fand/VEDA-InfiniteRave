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
  IMPORTED: {
      v1: { PATH: './videos/08.mov', SPEED: 1 },
  },
}*/
precision mediump float;
uniform vec2  resolution;
uniform float time;
uniform float volume;
uniform sampler2D midi;
uniform sampler2D mem;
uniform sampler2D backbuffer;
uniform sampler2D v1;

vec2 doModel(vec3 p);
#pragma glslify: raytrace = require('./utils/raytrace', map = doModel, steps = 100)
#pragma glslify: square = require('glsl-square-frame')
#pragma glslify: camera = require('glsl-camera-ray')
#pragma glslify: getNormal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: sdTorus = require('glsl-sdf-primitives/sdTorus')
#pragma glslify: sdBox = require('glsl-sdf-primitives/sdBox')
#pragma glslify: sdSphere = require('glsl-sdf-primitives/sdSphere')
#pragma glslify: sdCylinder = require('glsl-sdf-primitives/sdCylinder')
#pragma glslify: opU = require('glsl-sdf-ops/union')
#pragma glslify: opS = require('glsl-sdf-ops/subtraction')
#pragma glslify: smin = require('glsl-smooth-min')
#pragma glslify: noise4 = require('glsl-noise/simplex/4d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: import('./utils/utils')
#pragma glslify: import('./utils/sdBankohan')

vec2 IFS(inout vec3 z, float Scale, float Offset) {
  float r;
  float n = 0.;

  for (int i = 0; i < 4; i++) {
    float ii = float(i) * .2 * time;
    z = fold(z, n1);
    z = fold(z, n2);
    z = fold(z, n3);

    // z += .01;
    // z = fold(z, n4);
    // z = fold(z, n5);
    // z = fold(z, n6);

    z = z*Scale - Offset*(Scale-1.0);


    // z.xy = rot(z.xy, time);

    // z.xy = rot(z.xy, z.z * z.y * .7 - time * .4);
    // z.xz = rot(z.xz, z.y * z.x * .9 + time * .3);

    n++;
  }

  return vec2(pow(Scale, -n) , n);
}

vec2 DE2(vec3 z) {
  // z.xy = mix(z.xy, rot(z.xy, z.z + time * .3), cc(17.));
  // z.xz = mix(z.xz, rot(z.xz, z.y +time * .8), cc(17.));
  // z.xy = rot(z.xy, (z.x + z.y) * 3. + time * .3);
  // z.xz = rot(z.xz, z.y * .2 +time * .8);

  // return vec2(sdBox(z, vec3(.1)), 8.);

  vec2 sn = IFS(z, 4., 1.);

  // return (sdBox(z, vec3(.7, .2, .8))) * pow(Scale, -float(n));
  return vec2(
    // sdTorus(z, vec2(.8, .01)) * pow(Scale, -float(n)),
    sdBox(z, vec3(3.)) * sn.x,
    sn.y
  );
}

vec2 sdCenter(in vec3 p) {
  // p *= 1. - v();
  float d = sdBox(p, vec3(1));
  // p+=noise2(p.xy+time);
  // p+=noise2(p.xz+time);

  return vec2(d, 0);
}

vec2 doModel(vec3 p) {
  vec2 m = vec2(9999);

  m = opU(m, sdCenter(p));

  // p.xy = rot(p.xy, p.z * cc(16.) + t());
  // p.xz = rot(p.xy, p.z * cc(16.) + t());
  // m = opU(m, sdBankohan(rep(p, 4.) * 10.));

  // p.xz *= rot(p.xz, p.y * .7);
  p = rep(p, 4.);

  m = opU(m, DE2(p));

  return m;
}

vec3 doMaterial(vec3 pos, vec3 nor, float materialId) {
  if (materialId == 0.0) {
    return vec3(1, 0., .3);
  }
  if (materialId == 1.0) {
    return vec3(1, .4, .2);
  }
  if (materialId == 2.0) {
    return vec3(1, .4, .2);
  }
  if (materialId == 3.0) {
    return vec3(1, .4, .2);
  }
  if (materialId == 4.0) {

  }
  return vec3(0, .3, .5);
}

vec3 doLighting(vec3 pos, vec3 nor, vec3 rd, float dis, vec3 material) {
  vec3 lin = vec3(0.0);
  vec3 lightDir = normalize(vec3(1.0,0.7,0.9));
  lightDir.xy= rot(lightDir.xy, time);

  float diffuse = max(dot(nor,lightDir),0.0);
  lin += diffuse * vec3(2);
  return material * lin;
}

void main() {
  float cameraAngle  = 0.4 * t();
  vec3 rayOrigin = vec3(3.5 * sin(cameraAngle), 3.0, 3.5 * cos(cameraAngle));
  vec3 rayTarget = vec3(0, 0, 0);
  vec2 uv = square(resolution);
  vec2 uv0 = gl_FragCoord.xy / resolution;

  // float r = fract(sin(dot(vec2(time), vec2(9382.,498.))) * 392.);
  // float v = floor(mod(volume * 5., 10.));

  // uv = rot(uv, smoothstep(0., 1., length(uv) * 10. - time * 3.) + time * .6);

  // Rect
  uv = mix(uv, rect(uv), cc(18.));
  // uv = rect(uv);

  // float k = (abs(uv.x) + abs(uv.y)) * 10.;
  // uv = rot(uv, smoothstep(.1, .9, fract(k)) + floor(k) + time * .6);

  // uv = uv / pow(length(uv), .2); // fisheye
  // uv = uv / pow(length(uv), -2.); // fisheye

  vec3 rayDirection = camera(rayOrigin, rayTarget, uv, .4);

  // rayDirection.xy = rot(rayDirection.xy, t() * .1);
  // rayDirection.xz = rot(rayDirection.xz, t() * .2);

  if (c(.53, .2)) {
    rayDirection.xy = rot(rayDirection.xy, time * 3.1);
    rayDirection.xz = rot(rayDirection.xz, time * 2.2);
  }

  vec3 col = vec3(0.015);
  vec3 t = raytrace(rayOrigin, rayDirection, 10., 0.003, .8);

  if (t.x > -0.5) {
    vec3 pos = rayOrigin + t.x * rayDirection;
    vec3 nor = getNormal(pos);
    vec3 mal = doMaterial(pos, nor, t.y);

    col = doLighting(pos, nor, rayDirection, t.x, mal);
    col.b += 10. / t.z;
    // col *= 1. + 1. / abs(t.y);
    // col = fract(col + t.x* .3);
  }
  else {
    col = vec3(0, .5, .3) * .0;
  }

  // Color grading
  col = pow(clamp(col,0.0,1.0), vec3(0.6));

  col /= (1. - 3. / t.z);

  col = max(vec3(0), col);
  col *= cc(0.);


  if (c(.47, .08)) {
    col += texture2D(v1, abs(uv*.2)).rgb;
  }

  col += bloom(cc(22.));
  // col += bloom(.2);

  if (mod(time *fract(time), .73) < .01 || c(7., 2.)) {
    float r = random(vec2(uv0.y * .01, time)) * v() * .002;
    col.gb += texture2D(backbuffer, fract(uv0 - vec2(1,0) * r)).br;
  }
  if (c(4.3, 1.)) {
    col += bloom(.2);
  }

  vec3 hsv = rgb2hsv(col);
  hsv.x += cc(19.);
  col = hsv2rgb(hsv);

  // col += texture2D(backbuffer, gl_FragCoord.xy / resolution).rgb * .3;

  gl_FragColor = vec4(col, 1.0);
}
