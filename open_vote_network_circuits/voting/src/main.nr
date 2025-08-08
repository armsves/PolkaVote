fn main(vote_degree: Field,
        public_generator: pub Field,
        encrypted_vote: pub Field) {
    assert(encrypted_vote == public_generator.pow_32(vote_degree));
}

// #[test]
// fn test_main() {
    
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
