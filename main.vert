/*{
  "pixelRatio": 1,
  "vertexCount": 1000,
  "vertexMode": "LINES",
}*/
precision mediump float;
attribute float vertexId;
uniform float vertexCount;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec4 v_color;
uniform sampler2D mem;

void main() {
  float t = texture2D(mem, vec2(0)).x * .1;
  t = time*.2;
  float i = vertexId + sin(vertexId*.1) * .1;

  i+=t;

  vec3 pos = vec3(
    sin(i * 2),// * sin(t * .2 + i),
    cos(i * 7.3),// * cos(t * .49 + i),
    cos(t) * sin(t + vertexId)
  ) *.5;

  pos *= pos*pos;
  pos *= .4;

  gl_Position = vec4(pos.x, pos.y * resolution.x / resolution.y, pos.z * .1, 1);
  gl_PointSize = 3. / max(abs(pos.z), .1);

  v_color = vec4(
    fract(pos.x + i),
    fract(pos.y + i) * .1,
    fract(pos.z + i),
    1
  );
}
