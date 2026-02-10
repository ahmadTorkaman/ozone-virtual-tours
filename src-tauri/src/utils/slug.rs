/// Convert a name into a URL-friendly slug.
/// Lowercases, replaces non-alphanumeric chars with hyphens, trims leading/trailing hyphens,
/// and collapses consecutive hyphens.
pub fn slugify(name: &str) -> String {
    let slug: String = name
        .to_lowercase()
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect();

    // Collapse consecutive hyphens and trim
    let mut result = String::new();
    let mut prev_hyphen = false;
    for c in slug.chars() {
        if c == '-' {
            if !prev_hyphen && !result.is_empty() {
                result.push('-');
            }
            prev_hyphen = true;
        } else {
            result.push(c);
            prev_hyphen = false;
        }
    }

    // Trim trailing hyphen
    if result.ends_with('-') {
        result.pop();
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slugify_basic() {
        assert_eq!(slugify("My Project"), "my-project");
    }

    #[test]
    fn test_slugify_special_chars() {
        assert_eq!(slugify("Luxury Villa #3 (Modern)"), "luxury-villa-3-modern");
    }

    #[test]
    fn test_slugify_consecutive_spaces() {
        assert_eq!(slugify("  hello   world  "), "hello-world");
    }

    #[test]
    fn test_slugify_already_slug() {
        assert_eq!(slugify("already-a-slug"), "already-a-slug");
    }
}
