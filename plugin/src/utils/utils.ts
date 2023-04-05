function isValidCairo(filename: string) {
  return filename.endsWith(".cairo");
}

const getFileExtension = (filename: string) => filename.split(".").pop() || "";

const getFileNameFromPath = (path: string) => path.split("/").pop() || "";

let artifactFolder = (path: string) => {
  if (path.includes("artifacts")) return path.split("/").slice(0, -1).join("/");
  return path.split("/").slice(0, -1).join("/").concat("/artifacts");
};

let artifactFilename = (ext: ".json" | ".casm", filename: string) =>
  filename.split(".")[0].concat(ext);

export {
  isValidCairo,
  getFileExtension,
  getFileNameFromPath,
  artifactFolder,
  artifactFilename,
};
