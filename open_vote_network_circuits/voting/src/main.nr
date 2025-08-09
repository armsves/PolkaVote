fn main(vote_degree: Field,
        public_generator: Field,
        encrypted_vote: Field) {
    assert(encrypted_vote == public_generator.pow_32(vote_degree));
    // TODO assertion that the vote_degree is boolean
}

// #[test]
// fn test_main() {
    
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
