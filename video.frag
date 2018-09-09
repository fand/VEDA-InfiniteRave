/*{
    pixelRatio: 1,
    frameskip: 1,
    audio: true,
    IMPORTED: {
        v1: { PATH: './videos/08.mov', SPEED: 2 },
    },
}*/
precision highp float;
#extension GL_OES_standard_derivatives : enable

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;
uniform sampler2D v1;
uniform float volume;
uniform sampler2D samples;

vec2 rotate(in vec2 p, in float t) {
    return mat2(
        sin(t), cos(t),
        cos(t), -sin(t)
    ) * p;
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.,1.,f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec2 f1(in vec2 uv) {
    uv = abs(uv);
    uv = mix(uv, uv * uv, .3 + sin(time) *.2);

    float t = time * .73;
    float t1 = fract(sin(time * 8.1) *3092.);
    if (t1 < .2) {
        uv = rotate(uv, t);
    }
    if (.3 < t1 && t1 < .5) {
        uv = rotate(uv, t * (1. + length(uv) * sin(time * .3) * .003));
    }
    if (t1 > .9) {
        uv = sin(uv - t * .01);
    }

    // uv = uv * 2. - 1.;
    return uv;
}

vec2 f2(in vec2 uv) {
    uv -= .5;

    uv += noise(uv * 4. + time * .27) * .13 *sin(time + uv.y) * sin(time * 1.7+ 2.);

    float r1 = fract(sin(98. * time) * 329.) *.0003;
    uv = fract((fract(uv.x + uv.y) + uv) + 30.8 * r1) - .5;

    uv.x = fract(uv.x * 30. * sin(time) * noise(vec2(uv.x, time)) + time * .01);

    uv = rotate(uv, time + uv.y +uv.x);

    uv = mat2(
        2. / cos(time), uv.y,
        0.*cos(time * .2), 1
    ) * uv;

    return uv;
}

float r1(float a) {
    return fract(sin(a * 924.) * 492.);
}

vec2 f3(in vec2 uv) {
    uv = uv * .5 + .5;
    uv.y = fract(uv.y + random(vec2(time *2., 8.)) * .02 *(sin(time) + cos(time * 1.7)));
    float r = r1(time);

    float y = floor(uv.y * 48.) / 48.;
    y += random(vec2(y)) *.2;

    float t = (time +y);
    float ft = fract(t);
    float it = floor(t);
    r = pow(r * .3, 3.) + pow(ft * .8 +.5, 4.) *.2;
    uv.x = fract(uv.x + sin(y *204.) * r);

    return uv * 2. - 1.;
}

vec4 p1(in vec2 uv, in vec4 col) {
    // Calculate function
    float y = 0.;
    float x = abs(uv.x - .5);

    // Get audio
    y = texture2D(samples, uv).r * 2. - 1.;
    y += noise(vec2(x *8.2, x + time * 2.)) * .8;

    // Get steps from the function
    y =  y * .5 + .5;
    float k = 1. - smoothstep(.03, .031, abs(uv.y - y));

    vec4 c = col / (1. - k*.95);

    // Rotate UV and do the same
    vec2 uv2 = rotate(uv - .5, 3.14159 /2.) +.5;
    float x2 = abs(uv2.x - .5);
    float y2 = texture2D(samples, uv2).r * 2. - 1.;
    y2 += noise(vec2(x2 *8.2, x2 + time * 2.)) * .8;
    y2 =  y2 * .5 + .5;
    float k2 = 1. - smoothstep(.03, .031, abs(uv2.y - y2));
    c += c / (1. - k2*.95);

    return c;
}

vec4 p2(in vec2 uv0, in vec4 col) {
    vec2 uv = uv0 *2. - 1.;
    uv = abs(uv);
    float xy = uv.x +uv.y * 1.3 * (fract(time *.7) +.2);
    float k = smoothstep(.3, .4, sin(xy *20. + time * 3.) * sin(xy * 32. - time * 19.));
    return col * (k *2.+ .3);
}

vec4 p3(in vec2 uv0, in vec4 col) {
    vec2 uv = uv0 *2. - 1.;
    uv.x *= resolution.x / resolution.y;
    float l = length(uv);
    float k = sin(l * 17. + time * 7.) * sin(l *28. - time * 10.2);
    k = smoothstep(.3, .4, k);
    return col + k *.3;
}

vec4 p4(in vec2 uv0, in vec4 col) {
    vec2 uv = uv0 *2. - 1.;
    uv.x *= resolution.x / resolution.y;
    float l = length(uv);
    float k = sin(l * 9. + time * 7.) * sin(l *4. - time * 9.2);
    k = smoothstep(.3, .32, k);

    col = texture2D(v1, uv0 -k *0.1);
    return col *2.;
}

vec4 p5(in vec2 uv0, in vec4 col) {
    vec2 uv = uv0 * 3.;
    float k = sin((uv.x + sin(time) * 2.) * 3. + ((uv0.y * 20./sin(time)) * .2)) * sin(uv.x * .7 * uv.y * 6.16 + time * 10.);
    k = smoothstep(.21 * sin(time * 2.+8.) * .2, .7, k);
    return col +fract(col * k * 4.);
}

// vec4 p6(in vec2 uv0, in vec4 col) {
//     vec2 uv = uv0 * 3.;
//     float k = 1.;
//     k = smoothstep(.21 * sin(time * 2.+8.) * .2, .7, k);
//     return col +fract(col * k * 5.);
// }

vec4 p6(in vec2 uv0, in vec4 col) {
    vec2 uv = abs(uv0 - .5);
    vec3 o = vec3(0);
    float w = sin(time) * .3 + .8;

    // uv = rotate(abs(uv), -time *.2);
    uv = fract(uv - time * .1);
    // uv = mix(uv, uv * uv, -1.3);

    float xy = uv.x + uv.y;
    xy = fract(xy * 10. - time);
    float d = smoothstep(.3 - w, .3, xy) * smoothstep(.3 + w, .3, xy);
    o += vec3(d *.01, d * .02, d * .02);

    xy = uv.x + uv.y * 2.;
    xy = fract(xy * 5. + time * .8);
    d = smoothstep(.3 - w, .3, xy) * smoothstep(.3 + w, .3, xy);
    o += vec3(d *.01, d * .02, d * .02);

    xy = uv.x * 3. + uv.y;
    xy = fract(xy * 5. - time * 1.5);
    d = smoothstep(.3 - w, .3, xy) * smoothstep(.3 + w, .3, xy);
    o += vec3(d *.01, d * .02, d * .02) * 2.;

    o *= 10.;

    vec4 c = col;
    c.r = texture2D(v1, (uv0 - .5) * (1. + o.r) + .5).r;
    c.g = texture2D(v1, (uv0 - .5) * (1. + o.g) + .5).g;
    c.b = texture2D(v1, (uv0 - .5) * (1. + o.b) + .5).b;
    return c;
}

vec4 edge(in vec2 uv0, in vec4 col) {
    vec4 c = texture2D(v1, uv0);
    float gray = length(c.rgb);
    float d = dFdy(gray) + dFdy(gray);
    d = smoothstep(.0, 1., d);
    col = vec4(vec3(d * 30.), 1.0);
    return col;
}

void main() {
    float t = time * .73;

    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 uv0 = uv;

    // uv = uv * 2. - 1.;
    // uv *= uv;

    // uv = f2(uv);
    // uv = f1(uv);
    // uv = f3(uv);

    // DO NOT TOUCH
    gl_FragColor = texture2D(v1, uv);

    // gl_FragColor = p1(uv, gl_FragColor);
    // gl_FragColor = p2(uv0, gl_FragColor);

    // gl_FragColor = p3(uv0, gl_FragColor);
    // gl_FragColor = p4(uv0, gl_FragColor);
    // gl_FragColor = p5(uv0, gl_FragColor);
    gl_FragColor = p6(uv0, gl_FragColor);

    // gl_FragColor = edge(uv, gl_FragColor);

    // gl_FragColor = texture2D(v1, uv0);
    // gl_FragColor.r = texture2D(v1, uv).r;


    // gl_FragColor.b = .3 - gl_FragColor.r;

    // gl_FragColor *= 10. - 8.;

    // gl_FragColor += texture2D(backbuffer, (uv0 -.5) *.99 + .5) * .5;

    // gl_FragColor.b += texture2D(backbuffer, (uv0 -.5) *.99 + .5).r * .5;
}
