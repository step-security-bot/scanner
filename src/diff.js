// Import Third-party Dependencies
import difference from "lodash.difference";

export function extractList() {
  return {
    data: {},
    * [Symbol.iterator]() {
      for (const [key, uSet] of Object.entries(this.data)) {
        yield [key, [...uSet]];
      }
    },
    add(key, value) {
      if (key in this.data) {
        this.data[key].add(value);
      }
      else {
        this.data[key] = new Set([value]);
      }
    }
  };
}

export function* iterateNsecurePayload(payload) {
  for (const [depName, dependency] of Object.entries(payload.dependencies)) {
    for (const [depVersion, version] of Object.entries(dependency.versions)) {
      yield [`${depName}@${depVersion}`, version];
    }
  }
}

export function extract(payload) {
  const deps = new Set();
  const licenses = extractList();
  const flags = extractList();

  for (const [name, version] of iterateNsecurePayload(payload)) {
    deps.add(name);

    // TODO: found a better way to deal with this ?
    if (typeof version.license === "string") {
      licenses.add("Unknown", name);
    }
    else {
      for (const licenseName of version.license.uniqueLicenseIds) {
        licenses.add(licenseName, name);
      }
    }

    version.flags.forEach((flagName) => flags.add(flagName, name));
  }

  return {
    deps: [...deps],
    licenses: Object.fromEntries(licenses),
    flags: Object.fromEntries(flags)
  };
}

export function diff(previous, current) {
  const result = {
    licenses: {
      new: new Set(),
      added: {},
      removed: {}
    }
  };

  const previousExtraction = extract(previous);
  const currentExtraction = extract(current);

  for (const [licenseName, packages] of Object.entries(previousExtraction.licenses)) {
    if (licenseName in currentExtraction.licenses) {
      result.licenses.new.add(licenseName);
    }

    const delta = difference(packages, currentExtraction.licenses[licenseName]);
    console.log(delta);
  }

  return result;
}
