const { from } = Array;


export class Aborted extends Error {}

export class LogError extends Error {
	constructor( message, log ) {
		super( message );
		const type = "stdErr";
		this.log = from( log ).map( line => ({ type, line }) );
	}
}

export class VersionError extends Error {}

export class ProviderError extends Error {}

export class PlayerError extends Error {}
PlayerError.regex = [
	/^error: Failed to start player: /,
	/^error: The default player \(.+\) does not seem to be installed\./
];

export class UnableToOpenError extends Error {}
UnableToOpenError.regex = [
	/^error: Unable to open URL: /
];

export class NoStreamsFoundError extends Error {}
NoStreamsFoundError.regex = [
	/^error: No streams found on this URL: /
];

export class HostingError extends Error {}
HostingError.regex = [
	/^hosting was disabled by command line option$/
];

export class Warning extends Error {}
Warning.regex = [
	/InsecurePlatformWarning: A true SSLContext object is not available\./
];
