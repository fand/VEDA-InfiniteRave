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

vec3 rep(in vec3 p, in float unit) {
  p = mod(p, unit * 2.) - unit;
  p /= unit;
  return p;
}

vec3 bloom(in float level) {
  float d = level * .1;
  vec3 b = vec3(0.);

  vec2 uv = (gl_FragCoord.xy / resolution) - .5;
  vec2 uvr = uv;
  vec2 uvg = uv;
  vec2 uvb = uv;

  for (int i = 0; i < 20; i++) {
    uvr *= (1. - d * sin(time + 1.));
    uvg *= (1. - d * sin(time + 3.));
    uvb *= (1. - d * sin(time + 5.));

    b += vec3(
      texture2D(backbuffer, uvr + .5).r,
      texture2D(backbuffer, uvg + .5).g,
      texture2D(backbuffer, uvb + .5).b
    );
  }

  return b * level * .1;
}


const vec3 n1 = normalize(vec3(1, 0, 0));
const vec3 n2 = normalize(vec3(0, 1, 0));
const vec3 n3 = normalize(vec3(0, 0, 1));
const vec3 n4 = normalize(vec3(1, 1, -1));
const vec3 n5 = normalize(vec3(-1, 1, 1));
const vec3 n6 = normalize(vec3(1, -1, 1));

vec3 fold(in vec3 p, in vec3 n) {
  return p - 2. * min(0., dot(p, n)) * n;
}

vec2 rect(in vec2 uv){
  float k = (abs(uv.x) + abs(uv.y)) * 10.;
  return rot(uv, smoothstep(.1, .9, fract(k - time)) + floor(k) + t() * .6);
}

float v() {
  return volume * 5. * cc(21.);
}

float random(in vec2 st) {
  return fract(sin(dot(st, vec2(498., 940.))) * 4942.);
}

bool c(float a, float b) {
  float c2 = cc(20.);
  float ccc = floor(c2 * 20.);
  return c2 > 0.0 && mod(ccc, a) < b;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    // vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    // vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
