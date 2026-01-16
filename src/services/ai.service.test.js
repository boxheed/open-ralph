import { describe, it, expect, vi, afterEach } from 'vitest';
import { callGemini } from './ai.service';
import { EventEmitter } from 'events';

describe('ai.service', () => {
    // Helper to create a mock child process
    function createMockChildProcess() {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        return child;
    }

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should call gemini with correct arguments and resolve with output', async () => {
        const mockSpawn = vi.fn();
        const mockChild = createMockChildProcess();
        mockSpawn.mockReturnValue(mockChild);
        
        // Spy on process.stdout to prevent actual logging during test and verify streaming
        const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {});

        const prompt = 'Test Prompt';
        const promise = callGemini(prompt, { spawn: mockSpawn });

        // Verify spawn arguments
        expect(mockSpawn).toHaveBeenCalledWith('gemini', [prompt, '--allowed-tools', 'run_shell_command', 'write_file', 'replace']);

        // Simulate streaming data
        mockChild.stdout.emit('data', 'Hello ');
        mockChild.stdout.emit('data', 'World');
        
        // Simulate process exit
        mockChild.emit('close', 0);

        const result = await promise;

        expect(result).toBe('Hello World');
        expect(stdoutSpy).toHaveBeenCalledWith('Hello ');
        expect(stdoutSpy).toHaveBeenCalledWith('World');
    });

    it('should handle stderr output and resolve it as part of result', async () => {
        const mockSpawn = vi.fn().mockReturnValue(createMockChildProcess());
        const mockChild = mockSpawn(); // Get the returned mock (need to refactor test slightly to get ref)
        
        // Refactor: create mock child first
        const childProc = createMockChildProcess();
        mockSpawn.mockReturnValue(childProc);

        const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => {});

        const promise = callGemini('prompt', { spawn: mockSpawn });

        childProc.stderr.emit('data', 'Warning: ');
        childProc.stdout.emit('data', 'Success');
        childProc.emit('close', 0);

        const result = await promise;
        
        // Based on implementation, output += str for both stdout and stderr
        // The order depends on emission order.
        expect(result).toBe('Warning: Success');
        expect(stderrSpy).toHaveBeenCalledWith('Warning: ');
    });

    it('should reject if process exits with non-zero code', async () => {
        const mockSpawn = vi.fn();
        const childProc = createMockChildProcess();
        mockSpawn.mockReturnValue(childProc);

        const promise = callGemini('prompt', { spawn: mockSpawn });

        childProc.emit('close', 1);

        await expect(promise).rejects.toThrow('Gemini CLI failed with exit code 1');
    });

    it('should reject if spawn emits an error', async () => {
        const mockSpawn = vi.fn();
        const childProc = createMockChildProcess();
        mockSpawn.mockReturnValue(childProc);

        const promise = callGemini('prompt', { spawn: mockSpawn });

        childProc.emit('error', new Error('Spawn failed'));

        await expect(promise).rejects.toThrow('Gemini CLI failed: Spawn failed');
    });

    it('should return default message if no output received', async () => {
        const mockSpawn = vi.fn();
        const childProc = createMockChildProcess();
        mockSpawn.mockReturnValue(childProc);

        const promise = callGemini('prompt', { spawn: mockSpawn });
        childProc.emit('close', 0);

        const result = await promise;
        expect(result).toBe("No output from AI.");
    });
});