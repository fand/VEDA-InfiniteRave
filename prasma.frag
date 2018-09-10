precision highp float;

uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  float k = sin(uv.x * 30. + sin(time * 1.3 + 2.)) + cos(uv.y * 20. + sin(time * 1.7 + 3.));

  gl_FragColor = vec4(k,k,k,1);
}
