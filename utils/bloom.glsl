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
