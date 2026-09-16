<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #1a1a3e; font-size: 11px; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        p.meta { color: #4a4566; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d0ccdf; padding: 6px 8px; text-align: left; }
        th { background: #f6f4ff; }
        td.center { text-align: center; }
        .legend { margin: 12px 0; }
        .legend span { margin-right: 16px; }
        .footer { margin-top: 16px; color: #4a4566; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p class="meta">Hasil kuesioner biwraquiz — {{ count($rows) }} responden</p>

    <div class="legend">
        @foreach (App\Support\AnswerScale::LABELS as $value => $label)
            <span><strong>{{ $label }}</strong> = {{ App\Support\AnswerScale::description($value) }}</span>
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Responden</th>
                <th>Email</th>
                <th>Waktu Submit</th>
                <th>Rata-rata</th>
                @foreach ($questions as $index => $question)
                    <th>Q{{ $index + 1 }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $index => $row)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $row['respondent'] }}</td>
                    <td>{{ $row['email'] }}</td>
                    <td>{{ $row['submitted_at'] }}</td>
                    @php
                        $avg = count($row['answers']) > 0 ? round(array_sum($row['answers']) / count($row['answers']), 2) : 0;
                    @endphp
                    <td class="center">{{ $avg }}</td>
                    @foreach ($questions as $question)
                        <td class="center">{{ App\Support\AnswerScale::label($row['answers'][$question->id] ?? 0) }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="footer">Diekspor pada {{ now()->format('d-m-Y H:i') }}.</p>
</body>
</html>