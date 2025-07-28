const fs = require('fs');

// Function to increment patch version
function incrementPatchVersion(version) {
	const [major, minor, patch] = version.split('.').map(Number);
	return `${major}.${minor}.${patch + 1}`;
}

// Function to update version in a file
function updateVersionInFile(filePath, newVersion) {
	const content = fs.readFileSync(filePath, 'utf8');
	const updatedContent = content.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
	fs.writeFileSync(filePath, updatedContent, 'utf8');
	console.log(`Updated version in ${filePath} to ${newVersion}`);
}

// Main function
function updateVersion() {
	// Get current version from package.json
	const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	const currentVersion = packageJson.version;
	const newVersion = incrementPatchVersion(currentVersion);

	// Files to update
	const filesToUpdate = [
		'package.json',
		'manifest.chrome.json',
		'manifest.chrome.dev.json',
		'manifest.firefox.json',
		'manifest.firefox.dev.json',
	];

	// Update version in all files
	filesToUpdate.forEach(file => {
		updateVersionInFile(file, newVersion);
	});

	console.log(`\nVersion updated from ${currentVersion} to ${newVersion}`);
}

// Run the update
updateVersion();
