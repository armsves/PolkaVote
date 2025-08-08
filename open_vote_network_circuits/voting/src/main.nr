fn main(public_generator: Field,
        vote_degree: Field,
        encrypted_vote: pub Field) {
    assert(encrypted_vote == public_generator.pow_32(vote_degree));
}

// #[test]
// fn test_main() {
    
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
