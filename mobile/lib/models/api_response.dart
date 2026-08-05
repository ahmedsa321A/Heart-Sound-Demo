/// Generic API response wrapper mirroring the React `ApiResponse<T>`.
class ApiResponse<T> {
  final bool? success;
  final String? msg;
  final T? data;

  const ApiResponse({this.success, this.msg, this.data});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] as bool?,
      msg: json['msg'] as String? ?? json['message'] as String?,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'] as T?,
    );
  }
}
