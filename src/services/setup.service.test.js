import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetupService } from './setup.service';

const mockFs = {
    ensureDir: vi.fn(),
    pathExists: vi.fn(),
    outputFile: vi.fn(),
    readFile: vi.fn(),
    appendFile: vi.fn(),
    writeFile: vi.fn(),
};

describe('SetupService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initializeDirs', () => {
        it('should create required directories', async () => {
            await SetupService.initializeDirs({ fs: mockFs });
            
            expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('tasks/todo'));
            expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('tasks/done'));
            expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('tasks/failed'));
            expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('.ralph/personas'));
            expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('.ralph/context'));
        });
    });

    describe('seedPersonas', () => {
        it('should create persona files if they do not exist', async () => {
            mockFs.pathExists.mockResolvedValue(false);
            
            await SetupService.seedPersonas({ fs: mockFs });

            expect(mockFs.outputFile).toHaveBeenCalledWith(
                expect.stringContaining('ralph.md'),
                expect.stringContaining('ROLE: Senior Software Engineer')
            );
            expect(mockFs.outputFile).toHaveBeenCalledWith(
                expect.stringContaining('architect.md'),
                expect.stringContaining('ROLE: Software Architect')
            );
        });

        it('should not overwrite existing persona files', async () => {
            mockFs.pathExists.mockResolvedValue(true);
            
            await SetupService.seedPersonas({ fs: mockFs });

            expect(mockFs.outputFile).not.toHaveBeenCalled();
        });
    });

    describe('updateGitignore', () => {
        it('should append .ralph/context to .gitignore if not present', async () => {
            mockFs.pathExists.mockResolvedValue(true);
            mockFs.readFile.mockResolvedValue('node_modules\n');

            await SetupService.updateGitignore({ fs: mockFs });

            expect(mockFs.appendFile).toHaveBeenCalledWith(
                expect.stringContaining('.gitignore'),
                expect.stringContaining('.ralph/context')
            );
        });

        it('should create .gitignore if it does not exist', async () => {
            mockFs.pathExists.mockResolvedValue(false);

            await SetupService.updateGitignore({ fs: mockFs });

            expect(mockFs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('.gitignore'),
                expect.stringContaining('.ralph/context')
            );
        });

        it('should not modify .gitignore if .ralph/context is already ignored', async () => {
            mockFs.pathExists.mockResolvedValue(true);
            mockFs.readFile.mockResolvedValue('node_modules\n.ralph/context\n');

            await SetupService.updateGitignore({ fs: mockFs });

            expect(mockFs.appendFile).not.toHaveBeenCalled();
            expect(mockFs.writeFile).not.toHaveBeenCalled();
        });
    });

    describe('createConfigFile', () => {
        it('should create ralph.config.js if it does not exist', async () => {
            mockFs.pathExists.mockResolvedValue(false);

            await SetupService.createConfigFile({ fs: mockFs });

            expect(mockFs.outputFile).toHaveBeenCalledWith(
                expect.stringContaining('ralph.config.js'),
                expect.any(String)
            );
        });

        it('should not overwrite existing ralph.config.js', async () => {
            mockFs.pathExists.mockResolvedValue(true);

            await SetupService.createConfigFile({ fs: mockFs });

            expect(mockFs.outputFile).not.toHaveBeenCalled();
        });
    });

        describe('isInitialized', () => {

            it('should return true if tasks/todo exists', async () => {

                mockFs.pathExists.mockResolvedValue(true);

                const result = await SetupService.isInitialized({ fs: mockFs });

                expect(result).toBe(true);

            });

    

            it('should return false if tasks/todo does not exist', async () => {

                mockFs.pathExists.mockResolvedValue(false);

                const result = await SetupService.isInitialized({ fs: mockFs });

                expect(result).toBe(false);

            });

        });

    

        describe('runSetup', () => {

            it('should run all setup steps', async () => {

                const spyInit = vi.spyOn(SetupService, 'initializeDirs');

                const spySeed = vi.spyOn(SetupService, 'seedPersonas');

                const spyGit = vi.spyOn(SetupService, 'updateGitignore');

                const spyConfig = vi.spyOn(SetupService, 'createConfigFile');

    

                await SetupService.runSetup({ fs: mockFs });

    

                expect(spyInit).toHaveBeenCalledWith({ fs: mockFs });

                expect(spySeed).toHaveBeenCalledWith({ fs: mockFs });

                expect(spyGit).toHaveBeenCalledWith({ fs: mockFs });

                expect(spyConfig).toHaveBeenCalledWith({ fs: mockFs });

            });

        });

    });

    