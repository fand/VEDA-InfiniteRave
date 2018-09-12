/*{
  midi: true,
}*/
precision mediump float;
uniform vec2  resolution;
uniform float time;
uniform float volume;
uniform sampler2D midi;
uniform sampler2D mem;

float cc(in float c) {
  return texture2D(midi, vec2(176. / 256., c / 128.)).x * 2.;
}

void main() {
  if (gl_FragCoord.x + gl_FragCoord.y > 2.) { discard; }

  vec4 acc = texture2D(mem, vec2(0));
  float deltaTime = time - acc.x;
  float ratio = cc(23.) * 10. + 1.;

  gl_FragColor = vec4(
    time, // absTime
    acc.y + deltaTime * ratio, // accTime
    cc(23.), // for debug
    0
  );

  // gl_FragColor = fract(gl_FragColor);
}
