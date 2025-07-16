import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir, type CompiledCircuit } from '@noir-lang/noir_js';
// import circuit from "./circuit/target/circuit.json";
import rawCircuit from "../../../circuit/target/circuit.json";

import { useState } from "react";

export default function NoirApp() {
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [witness, setWitness] = useState<string[]>([]);
  const [age, setAge] = useState<number | "">("");

  const show = (setter: React.Dispatch<React.SetStateAction<string[]>>, content: string) => {
    setter((prev) => [...prev, content]);
  };

  const handleSubmit = async () => {
    try {
      const compiledCircuit = rawCircuit as unknown as CompiledCircuit;
      const noir = new Noir(compiledCircuit);
      const backend = new UltraHonkBackend(compiledCircuit.bytecode);
      console.log("logs", "Generating witness... ⏳");
      const { witness } = await noir.execute({ age });
      console.log("logs", "Generated witness... ✅");
      show(setLogs, `Age submitted: ${age}`);
      show(setWitness, `Age submitted: ${witness}`);
      show(setResults, `✅ Proof generated for age ${age}`);
      show(setLogs, "Generating proof... ⏳");
      const proof = await backend.generateProof(witness);
      show(setLogs, "Generated proof... ✅");
      const proofString = Buffer.from(proof.proof).toString("base64");
      show(setResults, proofString);
    //   show(setResults, proof.proof);
    } catch(e) {
        show(setLogs, "Oh 💔");
        console.error(e);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Noir app</h1>
      <div className="input-area" style={{ marginBottom: "1rem" }}>
        <input
          type="number"
          placeholder="Enter age"
          value={age}
          onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ marginRight: "1rem" }}
        />
        <button onClick={handleSubmit}>Submit Age</button>
      </div>
      <div className="outer" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div className="inner" style={{ width: "45%", border: "1px solid black", padding: "10px", wordBreak: "break-word" }}>
          <h2>Logs</h2>
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="inner" style={{ width: "45%", border: "1px solid black", padding: "10px", wordBreak: "break-word" }}>
          <h2>Proof</h2>
          {results.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="inner" style={{ width: "45%", border: "1px solid black", padding: "10px", wordBreak: "break-word" }}>
          <h2>Witness</h2>
          {results.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
