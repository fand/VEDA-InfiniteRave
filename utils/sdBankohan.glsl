vec2 sdBankohan(in vec3 p) {
    p *= 3.;
    vec3 c1 = vec3(0);
    float d1 = sdSphere(p - c1, 2.4 + sin(time + .2) * 1.);

    float d = 9999.;

    for (int i = 0; i < 2; i++) {
        float fi = float(i);
        float ti = (1. - pow(1. - fract((t() + fi * .2)), 1.5)) * 8.;

        vec3 u = vec3(rot(vec2(1, 0), (fi + 1.) * .7 * PI), 0);
        u.xy = rot(u.xy, (fi + 1.) * .3);
        u.xz = rot(u.xz, (fi * 2. + 1.) * 1.9);
        vec3 c2 = u * ti;
        float d2 = sdSphere(p - c2, .8 + sin(time)*1.);

        float a1 = max(dot(normalize(p - c1), normalize(c2 - c1)), 0.);
        float a2 = max(dot(normalize(p - c2), normalize(c1 - c2)), 0.);

        d = smin(
            d,
            smin(
                d1 * (1.1 - pow(a1, 20.)),
                d2 * (1.1 - pow(a2, 20.)),
                2.2
            ),
            2.5
        );

        for (int j = 0; j < 2; j++) {
            float fj = float(j);
            float tj = (1. - pow(1. - max(ti - 5. + fj * .8, 0.) / 3., 3.)) * 4.;

            vec3 uj = vec3(rot(vec2(1, 0), (fj + 1.) * .4 * PI + 1.5 * PI), 0);
            uj.xy = rot(uj.xy, (fi + 1.) * 1.3);
            uj.xz = rot(uj.xz, (fi * 3. + 1.) * .9);

            vec3 cj = c2 + uj * tj;
            float dj = sdSphere(p - cj, .3);

            float aj1 = max(dot(normalize(p - c2), normalize(cj - c2)), 0.);
            float aj2 = max(dot(normalize(p - cj), normalize(c2 - cj)), 0.);

            d = smin(
                d,
                smin(
                    d2 * (1.1 - pow(aj1, 10.)),
                    dj * (1.1 - pow(aj2, 10.)),
                    4.3
                ),
                3.6
            );
        }
    }

    return vec2(d, 2);
}
