class LASParser {
  constructor() {
    this.NULL_VALUE = -9999.00;
  }

  parse(content) {
    const lines = content.split('\n').map(line => line.trim());
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
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue;

      // Detect section headers
      if (line.match(/^~V/i)) {
        currentSection = 'version';
        continue;
      } else if (line.match(/^~W/i)) {
        currentSection = 'well';
        continue;
      } else if (line.match(/^~C/i)) {
        currentSection = 'curve';
        continue;
      } else if (line.match(/^~P/i)) {
        currentSection = 'parameter';
        continue;
      } else if (line.match(/^~A/i)) {
        currentSection = 'data';
        continue;
      }

      if (currentSection && sections[currentSection]) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  parseVersionSection(lines) {
    const version = {};
    
    for (const line of lines) {
      // Pattern: VERS.   2.00:  DESCRIPTION
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex + 1);
      
      // Split mnemonic and unit by the first dot
      const dotIndex = beforeColon.indexOf('.');
      if (dotIndex === -1) continue;
      
      const mnemonic = beforeColon.substring(0, dotIndex).trim();
      const rest = beforeColon.substring(dotIndex + 1).trim();
      
      // rest contains "UNIT VALUE" - split and take last token as value
      const parts = rest.split(/\s+/);
      const value = parts[parts.length - 1];
      const unit = parts.slice(0, -1).join(' ');
      
      version[mnemonic] = {
        unit: unit,
        value: value,
      };
    }
    
    return version;
  }

  parseWellSection(lines) {
    const well = {};
    
    for (const line of lines) {
      // Pattern: STRT.F    8665.00:  START DEPTH
      // Or:      LOC.      31.260966, -103.165250:  LOCATION
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
    
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex + 1);
      
      // Split mnemonic and unit by the first dot
      const dotIndex = beforeColon.indexOf('.');
      if (dotIndex === -1) continue;
      
      const mnemonic = beforeColon.substring(0, dotIndex).trim();
      const rest = beforeColon.substring(dotIndex + 1).trim();
      
      // rest contains "UNIT VALUE" or just "VALUE"
      // Split by whitespace and work backwards to find the value
      const parts = rest.split(/\s+/).filter(p => p.length > 0);
      
      let value, unit;
      
      if (parts.length === 0) {
        // Edge case: nothing after dot
        value = null;
        unit = '';
      } else if (parts.length === 1) {
        // Just value, no unit (or just unit, no value - ambiguous)
        value = parts[0];
        unit = '';
      } else {
        // Multiple parts: last one is value, rest is unit
        value = parts[parts.length - 1];
        unit = parts.slice(0, -1).join(' ');
      }
      
      // Try to parse as number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        value = numValue;
      }
      
      well[mnemonic] = {
        unit: unit,
        value: value,
        description: afterColon.trim(),
      };
    }
    
    return well;
  }

  parseCurveSection(lines) {
    const curves = [];
    
    for (const line of lines) {
      // Pattern: ROP(min/ft)    .UNKN   :  Track #  104
      // Pattern: Depth          .F      :  Track #   0
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const beforeColon = line.substring(0, colonIndex);
      const afterColon = line.substring(colonIndex + 1);
      
      // Find the dot that separates mnemonic from unit
      const dotIndex = beforeColon.indexOf('.');
      if (dotIndex === -1) continue;
      
      // Everything before the dot is the mnemonic (may contain parentheses, underscores, etc.)
      const mnemonic = beforeColon.substring(0, dotIndex).trim();
      
      // Everything after the dot is the unit
      const unit = beforeColon.substring(dotIndex + 1).trim();
      
      const description = afterColon.trim();
      
      curves.push({
        mnemonic: mnemonic,
        unit: unit,
        description: description,
      });
    }
    
    return curves;
  }

  parseDataSection(dataLines, curveLines) {
    const curves = this.parseCurveSection(curveLines);
    const curveCount = curves.length;
    const measurements = [];

    for (const line of dataLines) {
      // Split by whitespace
      const values = line.trim().split(/\s+/);
      
      if (values.length !== curveCount) {
        console.warn(`Skipping malformed data line (expected ${curveCount} values, got ${values.length})`);
        continue;
      }

      const dataPoint = {};
      
      for (let i = 0; i < curveCount; i++) {
        const value = parseFloat(values[i]);
        
        // Check for null value
        const isNull = isNaN(value) || Math.abs(value - this.NULL_VALUE) < 0.01;
        
        dataPoint[curves[i].mnemonic] = isNull ? null : value;
      }
      
      measurements.push(dataPoint);
    }

    return measurements;
  }

  getDepthRange(parsedData) {
    if (!parsedData.data || parsedData.data.length === 0) {
      return null;
    }
    
    const depthMnemonic = parsedData.curves[0].mnemonic;
    const depths = parsedData.data
      .map(d => d[depthMnemonic])
      .filter(d => d !== null);
    
    if (depths.length === 0) {
      return null;
    }
    
    return {
      start: Math.min(...depths),
      stop: Math.max(...depths),
      step: parsedData.well.STEP?.value || null,
    };
  }
}

module.exports = new LASParser();