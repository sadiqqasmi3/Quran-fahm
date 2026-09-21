#!/usr/bin/env node
import { validateManifestFile } from "./validate.js";

const [command, manifestPath] = process.argv.slice(2);

if (command !== "validate" || !manifestPath) {
  console.error("Usage: qf-content validate <manifest.json>");
  process.exitCode = 2;
} else {
  try {
    const result = await validateManifestFile(manifestPath);
    console.log(`Validated ${result.manifest.releaseId}: ${result.checkedAssets} immutable assets`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Content validation failed");
    process.exitCode = 1;
  }
}
