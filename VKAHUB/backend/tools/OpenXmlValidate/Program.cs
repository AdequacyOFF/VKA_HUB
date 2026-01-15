using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
using System;
using System.IO;
using System.Linq;

namespace OpenXmlValidate;

class Program
{
    static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.Error.WriteLine("Usage: OpenXmlValidate <path-to-docx>");
            Console.Error.WriteLine("       OpenXmlValidate <path-to-docx> --verbose");
            return 1;
        }

        string filePath = args[0];
        bool verbose = args.Contains("--verbose");

        if (!File.Exists(filePath))
        {
            Console.Error.WriteLine($"Error: File not found: {filePath}");
            return 1;
        }

        try
        {
            Console.WriteLine($"Validating: {filePath}");
            Console.WriteLine(new string('-', 60));

            using var doc = WordprocessingDocument.Open(filePath, false);

            // Create validator with all versions for comprehensive check
            var validator = new OpenXmlValidator(FileFormatVersions.Office2019);
            var errors = validator.Validate(doc).ToList();

            if (errors.Count == 0)
            {
                Console.WriteLine("RESULT: No validation errors found.");
                Console.WriteLine(new string('-', 60));
                return 0;
            }

            Console.WriteLine($"RESULT: Found {errors.Count} validation error(s):");
            Console.WriteLine();

            // Group errors by part
            var groupedErrors = errors
                .GroupBy(e => e.Part?.Uri?.ToString() ?? "Unknown")
                .OrderBy(g => g.Key);

            foreach (var group in groupedErrors)
            {
                Console.WriteLine($"Part: {group.Key}");
                Console.WriteLine();

                int errorNum = 1;
                foreach (var error in group)
                {
                    Console.WriteLine($"  [{errorNum}] {error.ErrorType}");
                    Console.WriteLine($"      Description: {error.Description}");

                    if (error.Node != null)
                    {
                        string nodeName = error.Node.LocalName;
                        Console.WriteLine($"      Element: {nodeName}");

                        if (verbose && error.Node is OpenXmlElement elem)
                        {
                            var outerXml = elem.OuterXml;
                            if (outerXml.Length > 200)
                                outerXml = outerXml.Substring(0, 200) + "...";
                            Console.WriteLine($"      XML: {outerXml}");
                        }
                    }

                    if (!string.IsNullOrEmpty(error.Path?.XPath))
                    {
                        Console.WriteLine($"      XPath: {error.Path.XPath}");
                    }

                    Console.WriteLine();
                    errorNum++;
                }
            }

            Console.WriteLine(new string('-', 60));
            Console.WriteLine($"Total errors: {errors.Count}");

            return errors.Count > 0 ? 2 : 0;
        }
        catch (OpenXmlPackageException ex)
        {
            Console.Error.WriteLine($"Package Error: {ex.Message}");
            return 3;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.GetType().Name}: {ex.Message}");
            if (verbose)
            {
                Console.Error.WriteLine(ex.StackTrace);
            }
            return 4;
        }
    }
}
