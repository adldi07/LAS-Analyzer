// src/services/lasParser.js

class LASParser {
    constructor() {
        this.NULL_VALUE = -999.25; // Common null value in LAS files
    }

    /**
     * Parse LAS file content
     * @param {string} content - Raw LAS file content
     * @returns {Object} Parsed LAS data
     */
    parse(content) {
        const lines = content.split('\n');

        const sections = this.splitIntoSections(lines);

        return {
            version: this.parseVersionSection(sections.version),
            well: this.parseWellSection(sections.well),
            curves: this.parseCurveSection(sections.curve),
            data: this.parseDataSection(sections.data, sections.curve),
        };
    }

    splitIntoSections(lines) {
        const sections = {
            version: [],
            well: [],
            curve: [],
            parameter: [],
            data: [],
        };

        let currentSection = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;

            // Detect section headers
            if (trimmedLine.match(/^~V/i)) {
                currentSection = 'version';
                continue;
            } else if (trimmedLine.match(/^~W/i)) {
                currentSection = 'well';
                continue;
            } else if (trimmedLine.match(/^~C/i)) {
                currentSection = 'curve';
                continue;
            } else if (trimmedLine.match(/^~P/i)) {
                currentSection = 'parameter';
                continue;
            } else if (trimmedLine.match(/^~A/i)) {
                currentSection = 'data';
                continue;
            }

            if (currentSection && sections[currentSection]) {
                sections[currentSection].push(trimmedLine);
            }
        }

        return sections;
    }

    parseVersionSection(lines) {
        const version = {};

        for (const line of lines) {
            const match = line.match(/^(\w+)\s*\.([^:]*):(.*)$/);
            if (match) {
                const [, mnemonic, unit, description] = match;
                version[mnemonic.trim()] = {
                    unit: unit.trim(),
                    value: description.trim(),
                };
            }
        }

        return version;
    }

    parseWellSection(lines) {
        const well = {};

        for (const line of lines) {
            const match = line.match(/^(\w+)\s*\.([^:]*):(.*)$/);
            if (match) {
                const [, mnemonic, unit, value] = match;
                well[mnemonic.trim()] = {
                    unit: unit.trim(),
                    value: value.trim(),
                };
            }
        }

        return well;
    }

    parseCurveSection(lines) {
        const curves = [];

        for (const line of lines) {
            // const match = line.match(/^(\w+)\s*\.([^:]*):(.*)$/);
            const match = line.match(/^([^.\s]+)\s*\.\s*([^:]*):(.*)$/);
            if (match) {
                const [, mnemonic, unit, description] = match;
                curves.push({
                    mnemonic: mnemonic.trim(),
                    unit: unit.trim(),
                    description: description.trim(),
                });
            }
        }

        return curves;
    }

    parseDataSection(dataLines, curveLines) {
        const curves = this.parseCurveSection(curveLines);
        const curveCount = curves.length;
        const measurements = [];

        for (const line of dataLines) {
            const values = line.trim().split(/\s+/);

            if (values.length !== curveCount) {
                console.warn(`Skipping malformed data line:---- ${values.length} ---- ${curveCount}`);
                continue;
            }

            const dataPoint = {};

            for (let i = 0; i < curveCount; i++) {
                const value = parseFloat(values[i]);
                // Check for null value
                dataPoint[curves[i].mnemonic] =
                    Math.abs(value - this.NULL_VALUE) < 0.01 ? null : value;
            }

            measurements.push(dataPoint);
        }

        return measurements;
    }

    /**
     * Extract depth range from parsed data
     */
    getDepthRange(parsedData) {
        const depths = parsedData.data.map(d => d[parsedData.curves[0].mnemonic]);
        return {
            start: Math.min(...depths),
            stop: Math.max(...depths),
            step: parsedData.well.STEP?.value || 'unknown',
        };
    }
}

module.exports = new LASParser();