import { describe, it, expect, vi, beforeEach } from 'vitest';
import aiService from './ai.service';
import events from 'events';

describe('ai.service', () => {
    let mockSpawn;

    beforeEach(() => {
        mockSpawn = vi.fn().mockImplementation(() => {
            const cp = new events.EventEmitter();
            cp.stdout = new events.EventEmitter();
            cp.stderr = new events.EventEmitter();
            cp.kill = vi.fn();
            // Emit close event on next tick to simulate process completion
            setTimeout(() => {
                cp.emit('close', 0);
            }, 10);
            return cp;
        });
    });

    // --- Strategy Pattern Tests ---

    it('should use provider.build() when available (Strategy Pattern)', async () => {
        const mockProvider = {
            build: vi.fn().mockReturnValue({
                command: 'test-cli',
                args: ['arg1', 'arg2']
            })
        };

        const config = {
            providers: { 'test-provider': mockProvider }
        };

        await aiService.callAI('hello', { 
            spawn: mockSpawn, 
            provider: 'test-provider', 
            config 
        });

        // Verify spawn was called with separated command and args, and shell: false
        expect(mockSpawn).toHaveBeenCalledWith('test-cli', ['arg1', 'arg2'], { shell: false });
        expect(mockProvider.build).toHaveBeenCalledWith('hello', expect.objectContaining({ model: null, files: '' }));
    });

    it('should pass model to provider.build()', async () => {
        const mockProvider = {
            build: vi.fn().mockReturnValue({ command: 'cmd', args: [] })
        };
        const config = { providers: { 'test': mockProvider } };

        await aiService.callAI('prompt', {
            spawn: mockSpawn,
            provider: 'test',
            config,
            model: 'gpt-4'
        });

        expect(mockProvider.build).toHaveBeenCalledWith('prompt', expect.objectContaining({ model: 'gpt-4' }));
    });

    it('should reject if provider does not export build function', async () => {
        const legacyProvider = {
            command: 'legacy-cli {prompt}'
        };
        const config = { providers: { 'legacy': legacyProvider } };

        await expect(aiService.callAI('hello', {
            spawn: mockSpawn,
            provider: 'legacy',
            config
        })).rejects.toThrow('must export a \'build\' function');
    });

    // --- Model Resolution Tests ---

    it('should prioritize task model > provider default > global config', async () => {
        const mockProvider = {
            defaultModel: 'provider-default',
            build: vi.fn().mockReturnValue({ command: 'cmd', args: [] })
        };
        const config = {
            model: 'global-default',
            providers: { 'test': mockProvider }
        };

        // 1. Task Override
        await aiService.callAI('p', { spawn: mockSpawn, provider: 'test', config, model: 'task-override' });
        expect(mockProvider.build).toHaveBeenLastCalledWith('p', expect.objectContaining({ model: 'task-override' }));

        // 2. Provider Default
        await aiService.callAI('p', { spawn: mockSpawn, provider: 'test', config });
        expect(mockProvider.build).toHaveBeenLastCalledWith('p', expect.objectContaining({ model: 'provider-default' }));

        // 3. Global Config (when provider default is null)
        mockProvider.defaultModel = null;
        await aiService.callAI('p', { spawn: mockSpawn, provider: 'test', config });
        expect(mockProvider.build).toHaveBeenLastCalledWith('p', expect.objectContaining({ model: 'global-default' }));
    });

    it('should reject if provider unknown', async () => {
        await expect(aiService.callAI('p', { provider: 'unknown' }))
            .rejects.toThrow('Unknown provider');
    });
});
