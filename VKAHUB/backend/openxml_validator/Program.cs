using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;

class Program
{
    static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Usage: openxml_validator <docx_file>");
            return 1;
        }

        string filePath = args[0];
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"ERROR: File not found: {filePath}");
            return 1;
        }

        Console.WriteLine($"Validating: {filePath}");
        Console.WriteLine(new string('=', 60));

        try
        {
            using (WordprocessingDocument doc = WordprocessingDocument.Open(filePath, false))
            {
                var validator = new OpenXmlValidator();
                var errors = validator.Validate(doc).ToList();

                if (errors.Count == 0)
                {
                    Console.WriteLine("RESULT: VALID - No schema errors found");
                    return 0;
                }
                else
                {
                    Console.WriteLine($"RESULT: INVALID - {errors.Count} error(s) found\n");

                    var errorsByPart = errors.GroupBy(e => e.Part?.Uri?.ToString() ?? "unknown");

                    foreach (var group in errorsByPart)
                    {
                        Console.WriteLine($"Part: {group.Key}");
                        foreach (var error in group)
                        {
                            Console.WriteLine($"  - [{error.ErrorType}] {error.Description}");
                            if (error.Node != null)
                            {
                                Console.WriteLine($"    Element: {error.Node.LocalName}");
                            }
                            if (!string.IsNullOrEmpty(error.Path?.XPath))
                            {
                                Console.WriteLine($"    XPath: {error.Path.XPath}");
                            }
                        }
                        Console.WriteLine();
                    }
                    return 2;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: Failed to open/validate document: {ex.Message}");
            return 3;
        }
    }
}
