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

    // --- Context Service Integration ---

    it('should use ContextService to build prompt if provided', async () => {
        const mockContextService = {
            buildContext: vi.fn().mockReturnValue('/path/to/context.md')
        };
        const mockTask = { content: 'Do task', data: {} };
        
        const mockProvider = {
            build: vi.fn().mockReturnValue({ command: 'cmd', args: [] })
        };
        const config = { providers: { 'test': mockProvider } };

        await aiService.callAI('original prompt', {
            spawn: mockSpawn,
            provider: 'test',
            config,
            contextService: mockContextService,
            task: mockTask
        });

        expect(mockContextService.buildContext).toHaveBeenCalledWith(mockTask);
        // Provider should receive the file path from ContextService, not 'original prompt'
        expect(mockProvider.build).toHaveBeenCalledWith('/path/to/context.md', expect.anything());
    });

    it('should handle process failure (non-zero exit code)', async () => {
        const failSpawn = vi.fn().mockImplementation(() => {
            const cp = new events.EventEmitter();
            cp.stdout = new events.EventEmitter();
            cp.stderr = new events.EventEmitter();
            setTimeout(() => cp.emit('close', 1), 10);
            return cp;
        });

        const config = { providers: { 'test': { build: () => ({ command: 'cmd' }) } } };
        await expect(aiService.callAI('p', { spawn: failSpawn, config, provider: 'test' }))
            .rejects.toThrow('failed with exit code 1');
    });

    it('should handle stderr output', async () => {
        const stderrSpawn = vi.fn().mockImplementation(() => {
            const cp = new events.EventEmitter();
            cp.stdout = new events.EventEmitter();
            cp.stderr = new events.EventEmitter();
            setTimeout(() => {
                cp.stderr.emit('data', Buffer.from('error details'));
                cp.emit('close', 0);
            }, 10);
            return cp;
        });

        const config = { providers: { 'test': { build: () => ({ command: 'cmd' }) } } };
        const output = await aiService.callAI('p', { spawn: stderrSpawn, config, provider: 'test' });
        expect(output).toContain('error details');
    });

    it('should handle timeout', async () => {
        vi.useFakeTimers();
        const slowSpawn = vi.fn().mockImplementation(() => {
            const cp = new events.EventEmitter();
            cp.stdout = new events.EventEmitter();
            cp.stderr = new events.EventEmitter();
            cp.kill = vi.fn();
            return cp;
        });

        const config = { providers: { 'test': { build: () => ({ command: 'cmd' }) } } };
        const promise = aiService.callAI('p', { spawn: slowSpawn, config, provider: 'test', timeout: 1000 });
        
        vi.advanceTimersByTime(1001);
        await expect(promise).rejects.toThrow('timed out after 1000ms');
        vi.useRealTimers();
    });
});
