import { execFile } from 'child_process';
import path, { extname, parse, join } from 'path';
// import iconv from './convert'

/*
 * options object (also passed by query())
 * target : The path the shortcut points to
 * args : The arguments passed to the target as a string
 * workingDir : The working directory of the target
 * runStyle : State to open the window in: ws.NORMAL (1), ws.MAX (3), or ws.MIN (7)
 * icon : The path to the shortcut icon file
 * iconIndex : An optional index for the image in the icon file
 * hotkey : A numerical hotkey
 * desc : A description
 */

function parseQuery(stdout) {
    // Parses the stdout of a shortcut.exe query into a JS object
    var result = {};
    result.expanded = {};
    stdout.split(/[\r\n]+/)
        .filter(function (line) { return line.indexOf('=') !== -1; })
        .forEach(function (line) {
            var pair = line.split('=', 2),
                key = pair[0],
                value = pair[1];
            if (key === "TargetPath")
                result.target = value;
            else if (key === "TargetPathExpanded")
                result.expanded.target = value;
            else if (key === "Arguments")
                result.args = value;
            else if (key === "ArgumentsExpanded")
                result.expanded.args = value;
            else if (key === "WorkingDirectory")
                result.workingDir = value;
            else if (key === "WorkingDirectoryExpanded")
                result.expanded.workingDir = value;
            else if (key === "RunStyle")
                result.runStyle = +value;
            else if (key === "IconLocation") {
                result.icon = value.split(',')[0];
                result.iconIndex = value.split(',')[1];
            } else if (key === "IconLocationExpanded") {
                result.expanded.icon = value.split(',')[0];
            } else if (key === "HotKey")
                result.hotkey = +value.match(/\d+/)[0];
            else if (key === "Description")
                result.desc = value;
        });
    Object.keys(result.expanded).forEach(function (key) {
        result.expanded[key] = result.expanded[key] || result[key];
    });
    return result;
}

// This function is supposed to act like a windows shell for compatibility with v0.1.2
// Meaning, treat carets as escape characters (replace ^<any> with <any>) and expand env vars
function expandEnv(path) {
    var envRE = /(^|[^^])%((?:\^.|[^^%])*)%/g; // Matches env vars, accounting for escaped chars. I feel dirty.
    return path.replace(envRE, function (_, g1, g2) {
        return g1 + process.env[g2];
    }).replace(/\^(.)/g, "$1");
}

function commandArgs(type, path, options) {
    // Generates a command for shortcut.exe
    var args = ['/A:' + type, '/F:' + expandEnv(path)];

    if (options) {
        if (options.target)
            args.push('/T:' + expandEnv(options.target));
        if (options.args)
            args.push('/P:' + expandEnv(options.args));
        if (options.workingDir)
            args.push('/W:' + expandEnv(options.workingDir) + '');
        if (options.runStyle)
            args.push('/R:' + options.runStyle);
        if (options.icon) {
            args.push('/I:' + expandEnv(options.icon) + ('iconIndex' in options ? ',' + options.iconIndex : ''));
        }
        if (options.hotkey)
            args.push('/H:' + options.hotkey);
        if (options.desc)
            args.push('/D:' + expandEnv(options.desc) + '');
    }
    return args;
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
}


export function query(path1, callback) {
    const exePath = path.join(__dirname, '../../resources', 'windows-shortcut', 'shortcut', 'Shortcut.exe');
    execFile(exePath,
        // {encoding}
        ['/A:Q', '/F:' + expandEnv(path1)],
        { encoding: 'hex' },
        function (error, stdout, stderr) {
            // console.log(stdout);
            
            let buffer = Buffer.from(stdout, 'hex')
            // console.log(new TextDecoder().decode(buffer));
            buffer = new TextDecoder('gbk').decode(buffer);
            var result = parseQuery(
                // iconv.decode(buffer, 'gbk')
                buffer
            );
            // console.log(result);
            callback(error ? stderr || stdout : null, result);
        });
}

export function create(path, optionsOrCallbackOrTarget, callback) {
    var options = isString(optionsOrCallbackOrTarget) ? { target: optionsOrCallbackOrTarget } : optionsOrCallbackOrTarget;
    callback = typeof optionsOrCallbackOrTarget === 'function' ? optionsOrCallbackOrTarget : callback;

    if (extname(path) !== ".lnk") { // Automatically generate shortcut if a .lnk file name is not given
        if (options && options.target) {
            var targetObj = parse(options.target); // TODO: deal with parse failure?
            var basename = targetObj.ext === ".lnk" ?
                options.target :
                targetObj.name + ".lnk";
            path = join(path, basename);
        } else {
            path = join(path, "New Shortcut.lnk");
        }
    }

    execFile(__dirname + '\\shortcut\\Shortcut.exe',
        commandArgs('C', path, options),
        function (error, stdout, stderr) {
            if (callback)
                callback(error ? stderr || stdout : null);
        });
}

export function edit(path, options, callback) {
    execFile(__dirname + '/shortcut/Shortcut.exe',
        commandArgs('E', path, options),
        function (error, stdout, stderr) {
            if (callback)
                callback(error ? stderr || stdout : null);
        });
}

export const NORMAL = 1;
export const MAX = 3;
export const MIN = 7;
