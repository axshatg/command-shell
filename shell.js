const commands = require('./commands.js');

try {
	process.chdir('/');
	console.log('Current working directory: ' + process.cwd());
} catch (err) {
	console.log(err);
}

process.stdout.write('\nprompt:' + process.cwd() + '>');

process.stdin.on('data', function (data) {
	const cmd = data.toString().trim().split(' ');
	const fn = cmd[0];

	const args = cmd.slice(1);

	if (!Object.keys(commands).includes(fn)) {
		try {
			commands.binaryFile.call(null, fn, args);
		} catch (err) {
			process.stdout.write('No such binary file or command exists.');
		}
	} else {
		commands[fn].call(null, args);
	}

	process.stdout.write('\nprompt:' + process.cwd() + '>');
});

process.on('exit', (code) => {
	console.log(`Shell exited with exit code: ${code}`);
	console.log('BYE! BYE!!');
});

process.on('uncaughtException', (err) => {
	console.log(err);
	process.stdout.write('\nprompt:' + process.cwd() + '>');
});

process.on('unhandledRejection', (err) => {
	console.log(err);
	process.stdout.write('\nprompt:' + process.cwd() + '>');
});
