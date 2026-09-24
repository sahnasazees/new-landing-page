<?php
/**
 * Nextal Media - Lead Generation Form Handler (form.php)
 * Processes incoming strategy booking form submissions,
 * delivers structured lead email to Info@nextalmedia.com,
 * saves backup to CSV, and redirects to thank-you.html.
 */

// Configuration
$to_email = "sahnasbeham.a@gmail.com";

// Allow cross-origin requests if needed
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Ensure POST request
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: index.html");
    exit;
}

// Detect if request is AJAX / JSON
$is_ajax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') 
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

// Read POST data (handles standard form and raw JSON)
$input_data = $_POST;
if (empty($input_data)) {
    $raw_input = file_get_contents("php://input");
    $decoded = json_decode($raw_input, true);
    if (is_array($decoded)) {
        $input_data = $decoded;
    }
}

// Sanitize helper
function clean_text($data) {
    return trim(strip_tags($data ?? ''));
}

$full_name        = clean_text($input_data["fullName"] ?? "");
$email            = filter_var(trim($input_data["email"] ?? ""), FILTER_SANITIZE_EMAIL);
$country_code     = clean_text($input_data["countryCode"] ?? "+91");
$phone_raw        = clean_text($input_data["phone"] ?? "");
$coach_type       = clean_text($input_data["coachType"] ?? "Not specified");
$experience_level = clean_text($input_data["experienceLevel"] ?? "Not specified");

// Clean phone formatting
$clean_country_code = preg_replace('/[^0-9+]/', '', $country_code);
$full_phone         = $clean_country_code . " " . $phone_raw;

// Validation
if (empty($full_name) || empty($email) || empty($phone_raw)) {
    if ($is_ajax) {
        http_response_code(400);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
        exit;
    } else {
        echo "<script>alert('Please fill in all required fields.'); window.history.back();</script>";
        exit;
    }
}

$first_name   = explode(" ", $full_name)[0];
$submitted_at = date("Y-m-d H:i:s T");
$ip_address   = $_SERVER["REMOTE_ADDR"] ?? "Unknown";

// Backup lead to CSV file (ensures leads are never lost even if SMTP/mail is disabled or delayed)
$log_file = __DIR__ . "/leads_backup.csv";
$csv_exists = file_exists($log_file);
$fp = @fopen($log_file, "a");
if ($fp) {
    if (!$csv_exists) {
        fputcsv($fp, ["Date & Time", "Name", "Email", "Phone", "Business Category", "Revenue Stage", "IP Address"]);
    }
    fputcsv($fp, [$submitted_at, $full_name, $email, $full_phone, $coach_type, $experience_level, $ip_address]);
    fclose($fp);
}

// Build Plain Text Email Message (Form Details Only - No CSS/HTML)
$subject = "New Lead: " . $full_name;

$message = "Name: " . $full_name . "\r\n"
         . "Email: " . $email . "\r\n"
         . "Phone: " . $full_phone . "\r\n"
         . "Business Category: " . $coach_type . "\r\n"
         . "Revenue Stage: " . $experience_level . "\r\n";

// Headers
$sender_email = "no-reply@nextalmedia.com";
$clean_name_for_header = preg_replace('/[\r\n]+/', '', $full_name);
$clean_email_for_header = preg_replace('/[\r\n]+/', '', $email);

$headers   = [];
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headers[] = "From: Nextal Media Leads <" . $sender_email . ">";
$headers[] = "Reply-To: " . $clean_name_for_header . " <" . $clean_email_for_header . ">";
$headers[] = "X-Mailer: PHP/" . phpversion();

// Send Mail with envelope sender fallback
$mail_headers = implode("\r\n", $headers);
$mail_sent = @mail($to_email, $subject, $message, $mail_headers, "-f " . $sender_email);
if (!$mail_sent) {
    $mail_sent = @mail($to_email, $subject, $message, $mail_headers);
}

// Target Redirect URL
$redirect_url = "thank-you.html?name=" . urlencode($first_name);

if ($is_ajax) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success"   => true,
        "mailSent"  => (bool)$mail_sent,
        "redirect"  => $redirect_url,
        "firstName" => $first_name
    ]);
    exit;
} else {
    header("Location: " . $redirect_url);
    exit;
}
