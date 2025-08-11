fn main(vote_degree: Field,
        public_generator: pub Field,
        encrypted_vote: pub Field) {
    assert(encrypted_vote == pow_254(public_generator, vote_degree));
    assert(vote_degree * (1 - vote_degree) == 0);
}

pub fn pow_254(base: Field, exponent: Field) -> Field {
    let mut r: Field = 1;
    let b: [u1; 254] = exponent.to_le_bits();

    for i in 1..254+1 {
        r *= r;
        r = (b[254 - i] as Field) * (r * base) + (1 - b[254 - i] as Field) * r;
    }
    r
}


#[test]
fn test_main() {
    let generator = 3;
    let encrypted = 3 * 3;
    main(2, generator, encrypted);
}

#[test]
fn test_zero() {
    let r = 21888242871839275222246405745257275088548364400416034343698204186575808495616 + 1;
    let generator = 3;
    let encrypted = 1;
    main(r, generator, encrypted);
}

