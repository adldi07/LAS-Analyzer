const fs = require('fs');
const path = require('path');

class FeatureFlagService {
    constructor() {
        // Go up one level from src/config to reach backend/config
        this.configPath = path.join(__dirname, '..', '..', 'config', 'features.json');
        this.flags = this.loadFlags();
        this.watchConfig();
    }

    loadFlags() {
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            const flags = JSON.parse(data);
            console.log('✅ Feature flags loaded:', flags);
            return flags;
        } catch (error) {
            console.warn('⚠️ Feature config not found, using defaults');
            return { mockAI: true, mockChat: false };
        }
    }

    watchConfig() {
        try {
            fs.watch(this.configPath, (eventType) => {
                if (eventType === 'change') {
                    console.log('🔄 Feature flags updated, reloading...');
                    this.flags = this.loadFlags();
                }
            });
            console.log('👀 Watching feature flags for changes...');
        } catch (error) {
            console.warn('⚠️ Could not watch config file:', error.message);
        }
    }

    isEnabled(flagName) {
        return this.flags[flagName] === true;
    }

    getAll() {
        return { ...this.flags };
    }
}

module.exports = new FeatureFlagService();
