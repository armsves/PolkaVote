use dep::std;
use std::hash::pedersen_commitment;
use std::embedded_curve_ops::EmbeddedCurvePoint;

fn main(    
    vote_commitment: pub [EmbeddedCurvePoint; 5],
    vote_openings: [Field; 5],
    vote_result: pub Field,
) 
{
    let mut homomorphism: EmbeddedCurvePoint = vote_commitment[0];
    let mut total = vote_openings[0];
    for i in 1..500 {
        homomorphism = homomorphism + vote_commitment[i];
        total += vote_openings[i];
    }
    let assertion_commitment: EmbeddedCurvePoint = pedersen_commitment([vote_result, total]);
    assert(homomorphism == assertion_commitment);
}

#[test]
fn test_main() {
    let curve_point_1 = std::hash::pedersen_commitment([420, 1]);
    let curve_point_2 = std::hash::pedersen_commitment([69, 1]);
    let hm_assert = std::hash::pedersen_commitment([489, 2]);
    let homomorphism: EmbeddedCurvePoint = curve_point_1 + curve_point_2;
    assert(hm_assert == homomorphism);
}
