fn main(random_value: Field,
        generator: pub Field,
        encrypted_random_value: pub Field) {
    assert(encrypted_random_value == generator.pow_32(random_value));
}

// let generators = derive_generators(DEFAULT_DOMAIN_SEPARATOR, 1, 0);
// let grumpkin_generator = generators[0];

#[test]
fn test_main() {
    // main(1, 2);

    // Uncomment to make test fail
    // main(1, 1);
}
