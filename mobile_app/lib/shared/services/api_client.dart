import 'package:dio/dio.dart';

import '../../core/errors/app_exception.dart';

class ApiClient {
	ApiClient._();

	static final Dio dio = Dio(
		BaseOptions(connectTimeout: const Duration(seconds: 30)),
	)..interceptors.add(
			InterceptorsWrapper(
				onError: (error, handler) {
					handler.reject(
						DioException(
							requestOptions: error.requestOptions,
							error: NetworkException(
								error.message ?? 'Network error',
								statusCode: error.response?.statusCode,
							),
						),
					);
					return;
				},
			),
		);
}