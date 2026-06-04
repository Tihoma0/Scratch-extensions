with open("webglextension.js", "r") as f:
    content = f.read().replace("//", "\n//")

def format_code(code):
    formatted_code = ""
    indent_level = 0
    in_string = False
    string_char = ""

    for char in code:
        if char in ['"', "'"]:
            if not in_string:
                in_string = True
                string_char = char
            elif string_char == char:
                in_string = False

        if not in_string:
            if char == '{':
                formatted_code += char + '\n' + '    ' * (indent_level + 1)
                indent_level += 1
            elif char == '}':
                indent_level -= 1
                formatted_code += '\n' + '    ' * indent_level + char
            elif char == ';':
                formatted_code += char + '\n' + '    ' * indent_level
            else:
                formatted_code += char
        else:
            formatted_code += char

    return formatted_code

formatted_content = format_code(content)
with open("tttttttttttttt.js", "w") as f:
    f.write(formatted_content)