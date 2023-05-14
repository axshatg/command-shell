const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const execFile = require('child_process').execFile;
const execFileSync = require('child_process').execFileSync;

const childProcesses = new Array();
let activeProcessIndex = undefined;

module.exports.pwd = (args) => {
	process.stdout.write(process.cwd());
	process.stdout.write('\nprompt:' + process.cwd() + '>');
};

module.exports.ls = (args) => {
	const dir = args.length !== 0 ? args[0] : process.cwd();
	fs.readdir(dir, function (err, files) {
		if (err) throw err;
		files.forEach(function (file) {
			process.stdout.write(file.toString() + '\n');
		});
		process.stdout.write('\nprompt:' + process.cwd() + '>');
	});
};

module.exports.cd = (args) => {
	try {
		process.chdir(args[0].split('\\').join(' '));
		process.stdout.write('Current working directory: ' + process.cwd());
	} catch (err) {
		if (err.code === 'ENOENT') {
			process.stdout.write('No such file or directory: ' + err.path);
		} else {
			console.log(err.Error);
		}
	}
	process.stdout.write('\nprompt:' + process.cwd() + '>');
};

module.exports.exit = (args) => {
	process.exit(0);
};

module.exports.fg = (args) => {
	const pid = args[0];
	console.log('Process id: ' + pid);

	const childProcIndex = childProcesses.findIndex(
		(childProcess) => childProcess.pid === pid
	);

	if (childProcIndex === -1) {
		process.stdout.write(`PID (${pid}): No such process exists.`);
		return;
	}

	if (activeProcessIndex) {
		childProcesses[activeProcessIndex].kill('SIGTSTP');
	}

	activeProcessIndex = childProcIndex;
	childProcesses[activeProcessIndex].kill('SIGCONT');

	process.stdout.write('\nprompt:' + process.cwd() + '>');
};

module.exports.binaryFile = (pathToBinary, args) => {
	console.log(pathToBinary, args);
	pathToBinary = pathToBinary.split('\\').join(' ');

	try {
		console.log(path.extname(pathToBinary));
		if (!fs.existsSync(pathToBinary)) {
			process.stdout.write('No such file or directory exists.');
			return;
		}

		if (fs.statSync(pathToBinary).isDirectory()) {
			process.stdout.write('Given path is a directory.');
			return;
		}

		if (path.extname(pathToBinary) !== '.bin') {
			process.stdout.write('Given path is a not a binary file.');
			return;
		}

		const proc = execFile(pathToBinary, args, { shell: true });

		proc.stdout.on('data', (data) => {
			console.log(data);
		});

		proc.stdout.on('error', function (err) {
			console.log(`Error in process with pid: ${this.pid}`);
		});

		proc.stdout.on('close', function () {
			console.log(`PID (${this.pid}): Process closed.`);
			process.stdout.write('\nprompt:' + process.cwd() + '>');
		});

		proc.stdout.on('pause', function () {
			console.log(`PID (${this.pid}): Process paused.`);
			process.stdout.write('\nprompt:' + process.cwd() + '>');
		});

		if (activeProcessIndex) {
			childProcesses[activeProcessIndex].kill('SIGTSTP');
		}

		activeProcessIndex = childProcesses.length;
		childProcesses.push(proc);

		process.stdout.write('PID of running process: ' + proc.pid);
	} catch (err) {
		// console.err(err);
		process.stdout.write('No such binary file or command exists.');
	}
};

process.on('SIGINT', () => {
	if (!activeProcessIndex) {
		process.stdout.write('\nNo child process running in foreground.');
		process.stdout.write('\nprompt:' + process.cwd() + '>');
		return;
	}

	process.stdout.write(
		`Killing process with pid: ${childProcesses[activeProcessIndex].pid}`
	);

	childProcesses[activeProcessIndex].kill('SIGINT');

	process.stdout.write(
		`Killed process with pid: ${childProcesses[activeProcessIndex].pid}`
	);

	childProcesses.splice(activeProcessIndex, 1);

	activeProcessIndex = undefined;

	process.stdout.write('\nprompt:' + process.cwd() + '>');
});

process.on('SIGTSTP', () => {
	if (!activeProcessIndex) {
		process.stdout.write('\nNo child process running in foreground.');
		process.stdout.write('\nprompt:' + process.cwd() + '>');
		return;
	}

	process.stdout.write(
		`Stopping process with pid: ${childProcesses[activeProcessIndex].pid}`
	);

	const stopped = childProcesses[activeProcessIndex].kill('SIGTSTP');

	process.stdout.write(
		`Stopped process with pid: ${childProcesses[activeProcessIndex].pid}`
	);

	if (!stopped) {
		process.stdout.write(
			`\nProcess with PID ${childProcesses[activeProcessIndex].pid} cannot be stopped.`
		);
		process.stdout.write('\nprompt:' + process.cwd() + '>');
		return;
	}

	activeProcessIndex = undefined;

	process.stdout.write('\nprompt:' + process.cwd() + '>');
});
