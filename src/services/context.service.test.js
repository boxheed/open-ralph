import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextService } from './context.service';
import path from 'path';

const MOCK_CWD = '/mock/cwd';

describe('ContextService', () => {
    let mockFs;
    let service;
    let config;

    beforeEach(() => {
        // Mock process.cwd()
        vi.spyOn(process, 'cwd').mockReturnValue(MOCK_CWD);

        mockFs = {
            existsSync: vi.fn(),
            readFileSync: vi.fn(),
            writeFileSync: vi.fn(),
            ensureDirSync: vi.fn(),
        };

        config = {
            defaultPersona: 'default-persona',
            dirs: {
                personas: path.join(MOCK_CWD, '.ralph', 'personas')
            }
        };

        service = new ContextService(config, mockFs);
    });

    describe('resolvePersona', () => {
        it('should resolve persona from task data', () => {
            const taskData = { persona: 'expert' };
            const personaPath = path.join(MOCK_CWD, '.ralph', 'personas', 'expert.md');
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('EXPERT CONTENT');

            const result = service.resolvePersona(taskData);

            expect(mockFs.existsSync).toHaveBeenCalledWith(personaPath);
            expect(mockFs.readFileSync).toHaveBeenCalledWith(personaPath, 'utf8');
            expect(result).toBe('EXPERT CONTENT');
        });

        it('should resolve persona from global config if task data missing', () => {
            const taskData = {};
            const personaPath = path.join(MOCK_CWD, '.ralph', 'personas', 'default-persona.md');
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('DEFAULT CONTENT');

            const result = service.resolvePersona(taskData);

            expect(mockFs.existsSync).toHaveBeenCalledWith(personaPath);
            expect(result).toBe('DEFAULT CONTENT');
        });

        it('should fallback to hardcoded default if persona file missing', () => {
            const taskData = { persona: 'missing' };
            
            mockFs.existsSync.mockReturnValue(false);

            const result = service.resolvePersona(taskData);

            expect(result).toContain('ROLE: Senior Engineer'); // Checks for default content
            // Should warn but not throw (console.warn not mocked here, but implied)
        });

        it('should handle custom personas directory', () => {
            config.dirs.personas = '/custom/personas';
            service = new ContextService(config, mockFs);
            
            const taskData = { persona: 'custom' };
            const personaPath = '/custom/personas/custom.md';
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('CUSTOM');

            service.resolvePersona(taskData);

            expect(mockFs.existsSync).toHaveBeenCalledWith(personaPath);
        });
    });

    describe('buildContext', () => {
        it('should generate context file with all sections', () => {
            const task = {
                content: 'Do this task',
                data: { 
                    persona: 'tester',
                    validation_cmd: 'npm test',
                    affected_files: 'src/file.js'
                },
                history: ['Attempt 1 failed']
            };

            // Mock persona resolution
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('TESTER ROLE');

            const contextPath = service.buildContext(task);

            expect(mockFs.ensureDirSync).toHaveBeenCalledWith(path.join(MOCK_CWD, '.ralph', 'context'));
            
            const expectedPath = path.join(MOCK_CWD, '.ralph', 'context', 'current_task.md');
            expect(contextPath).toBe(expectedPath);

            const writeCall = mockFs.writeFileSync.mock.calls[0];
            expect(writeCall[0]).toBe(expectedPath);
            
            const content = writeCall[1];
            expect(content).toContain('TESTER ROLE');
            expect(content).toContain('# TASK');
            expect(content).toContain('Do this task');
            expect(content).toContain('# CONSTRAINTS');
            expect(content).toContain('Validation Command: npm test');
            expect(content).toContain('Affected Files: src/file.js');
            expect(content).toContain('# HISTORY');
            expect(content).toContain('Attempt 1 failed');
        });

        it('should omit optional sections if missing', () => {
             const task = {
                content: 'Simple task',
                data: {}, // No validation, no files
                history: []
            };

            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('ROLE');

            service.buildContext(task);

            const content = mockFs.writeFileSync.mock.calls[0][1];
            expect(content).toContain('# TASK');
            expect(content).not.toContain('# CONSTRAINTS');
            expect(content).not.toContain('# HISTORY');
        });
    });
});
