const { exec } = require('child_process');
const prompts = require('prompts');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let blockName = args[0];

(async () => {
	// Dynamic import for chalk to handle ES module
	const chalk = (await import('chalk')).default;

	// Basic environment validation
	if (!fs.existsSync('package.json')) {
		process.stdout.write(
			chalk.red('❌ No package.json found in current directory!\n')
		);
		process.stdout.write(
			chalk.yellow(
				"💡 Make sure you're running this from the plugin root directory.\n"
			)
		);
		process.exit(1);
	}

	if (!fs.existsSync('node_modules')) {
		process.stdout.write(
			chalk.red('❌ node_modules directory not found!\n')
		);
		process.stdout.write(
			chalk.yellow(
				'💡 Run "npm install" first to install dependencies.\n'
			)
		);
		process.exit(1);
	}

	if (!blockName) {
		const response = await prompts({
			type: 'text',
			name: 'blockName',
			message: chalk.cyan(
				'Enter the block name, or press enter to build all blocks'
			),
		});
		blockName = response.blockName;
	}

	if (
		!blockName ||
		blockName === 'all' ||
		blockName === 'ALL' ||
		blockName === 'library' ||
		blockName === 'LIBRARY'
	) {
		process.stdout.write(chalk.blue('🔨 Building all blocks...\n'));
		exec(
			'npx wp-scripts build --webpack-copy-php',
			(error, stdout, stderr) => {
				if (error) {
					process.stdout.write(
						chalk.red(
							'❌ Failed to build non-interactive blocks!\n'
						)
					);
					process.stdout.write(chalk.red('Error details:\n'));
					process.stdout.write(
						chalk.red(`Exit code: ${error.code}\n`)
					);
					if (stderr) {
						process.stdout.write(chalk.red('STDERR:\n'));
						process.stdout.write(chalk.gray(stderr));
					}
					if (stdout) {
						process.stdout.write(chalk.yellow('STDOUT:\n'));
						process.stdout.write(chalk.gray(stdout));
					}
					process.stdout.write(chalk.red('\n💡 Common solutions:\n'));
					process.stdout.write(
						chalk.yellow(
							'- Check if all dependencies are installed (npm install)\n'
						)
					);
					process.stdout.write(
						chalk.yellow('- Verify your webpack configuration\n')
					);
					process.stdout.write(
						chalk.yellow(
							'- Check for syntax errors in your block files\n'
						)
					);
					return; // Stop execution on error
				} else {
					process.stdout.write(stdout);
				}
				process.stdout.write(
					chalk.green('✅ Non-interactive blocks built!\n')
				);

				exec(
					'npx wp-scripts build --experimental-modules --webpack-copy-php',
					(error, stdout, stderr) => {
						if (error) {
							process.stdout.write(
								chalk.red(
									'❌ Failed to build interactive blocks!\n'
								)
							);
							process.stdout.write(chalk.red('Error details:\n'));
							process.stdout.write(
								chalk.red(`Exit code: ${error.code}\n`)
							);
							if (stderr) {
								process.stdout.write(chalk.red('STDERR:\n'));
								process.stdout.write(chalk.gray(stderr));
							}
							if (stdout) {
								process.stdout.write(chalk.yellow('STDOUT:\n'));
								process.stdout.write(chalk.gray(stdout));
							}
							process.stdout.write(
								chalk.red('\n💡 Common solutions:\n')
							);
							process.stdout.write(
								chalk.yellow(
									'- Check if your blocks support interactivity API correctly\n'
								)
							);
							process.stdout.write(
								chalk.yellow(
									'- Verify block.json has "supports": {"interactivity": true}\n'
								)
							);
							process.stdout.write(
								chalk.yellow(
									'- Check for issues with view.js files\n'
								)
							);
							return; // Stop execution on error
						} else {
							process.stdout.write(stdout);
						}
						process.stdout.write(
							chalk.green('✅ Interactive blocks built!\n')
						);

						exec(
							'npx wp-scripts build-blocks-manifest',
							(error, stdout, stderr) => {
								if (error) {
									process.stdout.write(
										chalk.red(
											'❌ Failed to build blocks manifest!\n'
										)
									);
									process.stdout.write(
										chalk.red('Error details:\n')
									);
									process.stdout.write(
										chalk.red(`Exit code: ${error.code}\n`)
									);
									if (stderr) {
										process.stdout.write(
											chalk.red('STDERR:\n')
										);
										process.stdout.write(
											chalk.gray(stderr)
										);
									}
									if (stdout) {
										process.stdout.write(
											chalk.yellow('STDOUT:\n')
										);
										process.stdout.write(
											chalk.gray(stdout)
										);
									}
									process.stdout.write(
										chalk.red('\n💡 Common solutions:\n')
									);
									process.stdout.write(
										chalk.yellow(
											'- Check if src/ directory exists and contains block.json files\n'
										)
									);
									process.stdout.write(
										chalk.yellow(
											'- Verify build/ directory is writable\n'
										)
									);
									process.stdout.write(
										chalk.yellow(
											'- Ensure all block.json files are valid JSON\n'
										)
									);
									return; // Stop execution on error
								} else {
									process.stdout.write(stdout);
								}
								process.stdout.write(
									chalk.green('✅ Blocks manifest built!\n')
								);
							}
						);
					}
				);
			}
		);
	} else {
		const src = `./src/${blockName}/`;
		const output = `./build/${blockName}/`;

		// Check if src directory exists
		if (!fs.existsSync(src)) {
			process.stdout.write(
				chalk.red(
					`❌ Block does not exist at ${src}. Build process stopped.`
				)
			);
			process.exit(1);
		}

		// Check block.json for interactivity support
		let isInteractive = false;
		const blockJsonPath = path.join(src, 'block.json');
		if (fs.existsSync(blockJsonPath)) {
			try {
				const blockJson = JSON.parse(
					fs.readFileSync(blockJsonPath, 'utf8')
				);
				isInteractive = blockJson.supports?.interactivity || false;
			} catch (error) {
				process.stdout.write(
					chalk.yellow(
						`⚠️  Warning: Could not parse block.json at ${blockJsonPath}\n`
					)
				);
				process.stdout.write(chalk.yellow(`Error: ${error.message}\n`));
				process.stdout.write(chalk.yellow('💡 Check for:\n'));
				process.stdout.write(chalk.yellow('- Valid JSON syntax\n'));
				process.stdout.write(
					chalk.yellow('- Missing commas or brackets\n')
				);
				process.stdout.write(chalk.yellow('- Correct file encoding\n'));
				process.stdout.write(
					chalk.yellow('Continuing with non-interactive build...\n\n')
				);
			}
		}

		const ellipses = ['.', '..', '...', ''];
		let ellipsesIndex = 0;
		const interval = setInterval(() => {
			readline.cursorTo(process.stdout, 0);
			process.stdout.write(
				chalk.blue(
					`⚒️ Building block: ${chalk.bold(blockName)}${ellipses[ellipsesIndex]}`
				)
			);
			ellipsesIndex = (ellipsesIndex + 1) % ellipses.length;
		}, 500);

		// Clear the interval when the build process is done
		let command = `npx wp-scripts build --source-path=${src} --output-path=${output} --webpack-copy-php`;
		if (isInteractive) {
			command += ' --experimental-modules';
			process.stdout.write(
				chalk.magenta(
					`🏗️ ${chalk.bgMagenta.white('(🔌iAPI)')} Building block: ${blockName}\n`
				)
			);
		} else {
			process.stdout.write(
				chalk.cyan(`🏗️ Building block: ${blockName}\n`)
			);
		}
		// Now run the manifest build command
		command +=
			'; npx wp-scripts build-blocks-manifest --input=./src --output=./build/blocks-manifest.php';

		// Execute everything:
		exec(command, (error, stdout, stderr) => {
			process.stdout.write(chalk.gray(`\nRunning command: ${command}\n`));
			clearInterval(interval);
			readline.cursorTo(process.stdout, 0);
			process.stdout.write(' '.repeat(50)); // Clear the line
			readline.cursorTo(process.stdout, 0);

			if (error) {
				process.stdout.write(
					chalk.red(`❌ Failed to build block: ${blockName}!\n`)
				);
				process.stdout.write(chalk.red('Error details:\n'));
				process.stdout.write(chalk.red(`Exit code: ${error.code}\n`));
				process.stdout.write(chalk.red(`Command: ${command}\n`));

				if (stderr) {
					process.stdout.write(chalk.red('\nSTDERR:\n'));
					process.stdout.write(chalk.gray(stderr));
				}
				if (stdout) {
					process.stdout.write(chalk.yellow('\nSTDOUT:\n'));
					process.stdout.write(chalk.gray(stdout));
				}

				process.stdout.write(chalk.red('\n💡 Common solutions:\n'));
				process.stdout.write(
					chalk.yellow(`- Check if block source exists at: ${src}\n`)
				);
				process.stdout.write(
					chalk.yellow(
						'- Verify all dependencies are installed (npm install)\n'
					)
				);
				process.stdout.write(
					chalk.yellow(
						'- Check block.json syntax and required fields\n'
					)
				);
				process.stdout.write(
					chalk.yellow(
						'- Look for JavaScript/TypeScript syntax errors\n'
					)
				);
				process.stdout.write(
					chalk.yellow('- Ensure build directory is writable\n')
				);

				if (isInteractive) {
					process.stdout.write(
						chalk.yellow('- Interactive block specific:\n')
					);
					process.stdout.write(
						chalk.yellow(
							'  * Verify view.js file exists and is valid\n'
						)
					);
					process.stdout.write(
						chalk.yellow('  * Check interactivity API usage\n')
					);
				}

				process.exit(1); // Exit with error code
			} else {
				process.stdout.write(
					chalk.green('✅ Build process complete!\n')
				);
				process.stdout.write(stdout);
				process.stdout.write(chalk.green('✅ Build complete!\n'));
			}
		});
	}
})();
